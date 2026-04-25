#!/usr/bin/env node
// Argus — daily codebase auditor.
// Runs in GitHub Actions. Surfaces TS errors, lint issues, leaked secrets,
// outdated deps. Posts a report row to Supabase and sends a morning email
// via Resend. Read path: /api/argus/recent → Mission Control inbox.

import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  RESEND_API_KEY,
  AUDIT_EMAIL_TO,
  AUDIT_EMAIL_FROM = 'Argus <argus@propelcoaches.com>',
  REPO_NAME = 'web-dashboard',
  GITHUB_SHA = '',
  GITHUB_REF_NAME = '',
  GITHUB_RUN_URL = '',
} = process.env;

const startedAt = Date.now();
const cwd = process.cwd();

function run(cmd, { allowFail = true } = {}) {
  try {
    const out = execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
    return { ok: true, stdout: out, stderr: '' };
  } catch (err) {
    if (!allowFail) throw err;
    return {
      ok: false,
      stdout: err.stdout?.toString() || '',
      stderr: err.stderr?.toString() || '',
      code: err.status ?? 1,
    };
  }
}

// ── TypeScript ────────────────────────────────────────────────────────
function auditTypeScript() {
  console.log('[argus] tsc --noEmit');
  const r = run('npx --no-install tsc --noEmit --pretty false');
  if (r.ok) return { errors: 0, findings: [] };
  const lines = (r.stdout + r.stderr)
    .split('\n')
    .filter(l => /error TS\d+:/.test(l));
  const findings = lines.slice(0, 30).map(line => ({ kind: 'ts', message: line.trim() }));
  return { errors: lines.length, findings };
}

// ── ESLint ────────────────────────────────────────────────────────────
function auditLint() {
  console.log('[argus] eslint');
  if (!existsSync(join(cwd, '.eslintrc.json')) && !existsSync(join(cwd, '.eslintrc.js')) && !existsSync(join(cwd, 'eslint.config.mjs')) && !existsSync(join(cwd, 'eslint.config.js'))) {
    return { errors: 0, warnings: 0, findings: [], skipped: 'no eslint config' };
  }
  const r = run('npx --no-install eslint "src/**/*.{ts,tsx,js,jsx}" -f json');
  const body = (r.stdout || '').trim();
  if (!body) return { errors: 0, warnings: 0, findings: [] };
  let parsed;
  try { parsed = JSON.parse(body); } catch { return { errors: 0, warnings: 0, findings: [{ kind: 'lint', message: 'eslint output unparseable' }] }; }
  let errors = 0, warnings = 0;
  const findings = [];
  for (const file of parsed) {
    if (!file.messages?.length) continue;
    for (const m of file.messages) {
      if (m.severity === 2) errors++; else warnings++;
      if (findings.length < 30) {
        findings.push({
          kind: m.severity === 2 ? 'lint-error' : 'lint-warning',
          file: relative(cwd, file.filePath),
          line: m.line,
          rule: m.ruleId,
          message: m.message,
        });
      }
    }
  }
  return { errors, warnings, findings };
}

// ── Secret scan ───────────────────────────────────────────────────────
// Lightweight homegrown scan. Looks for obvious high-entropy tokens in
// source files. Not a replacement for a full secrets platform, but a
// useful signal when something leaks into a commit.
const SECRET_PATTERNS = [
  { name: 'OpenAI key', re: /\bsk-[A-Za-z0-9]{20,}\b/ },
  { name: 'Anthropic key', re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/ },
  { name: 'Stripe live key', re: /\b(sk|rk)_live_[A-Za-z0-9]{20,}\b/ },
  { name: 'Stripe restricted test', re: /\brk_test_[A-Za-z0-9]{20,}\b/ },
  { name: 'Google API key', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: 'Resend key', re: /\bre_[A-Za-z0-9]{30,}\b/ },
  { name: 'AWS access key', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Supabase service key', re: /\beyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/ },
];

const SCAN_EXCLUDE = new Set(['node_modules', '.next', '.git', 'dist', 'build', '.vercel', 'out', 'coverage']);
const SCAN_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.env', '.yaml', '.yml', '.md']);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SCAN_EXCLUDE.has(name)) continue;
    const full = join(dir, name);
    const s = statSync(full);
    if (s.isDirectory()) yield* walk(full);
    else yield full;
  }
}

function auditSecrets() {
  console.log('[argus] secret scan');
  const findings = [];
  for (const path of walk(cwd)) {
    const ext = path.slice(path.lastIndexOf('.'));
    if (!SCAN_EXTS.has(ext)) continue;
    let text;
    try { text = readFileSync(path, 'utf8'); } catch { continue; }
    if (text.length > 1_500_000) continue;
    for (const p of SECRET_PATTERNS) {
      const m = text.match(p.re);
      if (m) {
        findings.push({ kind: 'secret', file: relative(cwd, path), pattern: p.name });
        break;
      }
    }
  }
  return { found: findings.length, findings };
}

// ── Outdated deps ─────────────────────────────────────────────────────
function auditDeps() {
  console.log('[argus] npm outdated');
  const r = run('npm outdated --json');
  const body = (r.stdout || '').trim();
  if (!body) return { outdated: 0, findings: [] };
  let parsed;
  try { parsed = JSON.parse(body); } catch { return { outdated: 0, findings: [] }; }
  const entries = Object.entries(parsed);
  const findings = entries.slice(0, 15).map(([name, info]) => ({
    kind: 'dep-outdated',
    package: name,
    current: info.current,
    latest: info.latest,
    type: info.type,
  }));
  return { outdated: entries.length, findings };
}

// ── Post to Supabase ──────────────────────────────────────────────────
async function postReport(row) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[argus] Supabase env missing, skipping insert');
    return null;
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/audit_reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    console.error('[argus] Supabase insert failed:', res.status, await res.text());
    return null;
  }
  const [created] = await res.json();
  console.log('[argus] Report stored:', created.id);
  return created;
}

// ── Email via Resend ──────────────────────────────────────────────────
async function sendEmail(report) {
  if (!RESEND_API_KEY || !AUDIT_EMAIL_TO) {
    console.warn('[argus] Resend env missing, skipping email');
    return;
  }
  const subject = `[Argus] ${report.status.toUpperCase()} — ${report.repo} — ${new Date(report.created_at || Date.now()).toLocaleDateString('en-AU')}`;
  const html = renderEmail(report);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: AUDIT_EMAIL_FROM, to: [AUDIT_EMAIL_TO], subject, html }),
  });
  if (!res.ok) console.error('[argus] Resend failed:', res.status, await res.text());
  else console.log('[argus] Email sent to', AUDIT_EMAIL_TO);
}

function renderEmail(r) {
  const findingsList = (r.findings || []).slice(0, 20).map(f => {
    const loc = f.file ? ` <code style="color:#888">${f.file}${f.line ? ':' + f.line : ''}</code>` : '';
    const rule = f.rule ? ` <span style="color:#777;font-size:11px">[${f.rule}]</span>` : '';
    return `<li style="margin:4px 0;font-size:13px;"><strong style="color:#d88;">${f.kind}</strong>${loc}${rule} — ${(f.message || f.package || f.pattern || '').toString().slice(0, 220)}</li>`;
  }).join('');
  const statusColor = r.status === 'clean' ? '#6bcf7f' : r.status === 'warnings' ? '#ffcb3d' : '#ff6b6b';
  return `<!doctype html><html><body style="background:#0a0a12;color:#eee;font-family:system-ui,-apple-system,sans-serif;padding:24px;">
  <div style="max-width:680px;margin:0 auto;background:#12121a;border:1px solid #222;border-radius:16px;padding:28px;">
    <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#5e81ac;font-weight:700;">Argus · Daily Audit</div>
    <div style="font-size:22px;font-weight:800;margin:8px 0 4px;color:${statusColor};">${r.status.toUpperCase()} · ${r.repo}</div>
    <div style="font-size:12px;color:#888;margin-bottom:20px;">${r.summary}</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:20px 0;">
      <div style="background:#1a1a24;padding:10px;border-radius:8px;"><div style="font-size:10px;color:#888;">TS ERRORS</div><div style="font-size:18px;font-weight:800;">${r.ts_errors}</div></div>
      <div style="background:#1a1a24;padding:10px;border-radius:8px;"><div style="font-size:10px;color:#888;">LINT</div><div style="font-size:18px;font-weight:800;">${r.lint_errors}<span style="font-size:11px;color:#888;"> · ${r.lint_warnings}w</span></div></div>
      <div style="background:#1a1a24;padding:10px;border-radius:8px;"><div style="font-size:10px;color:#888;">SECRETS</div><div style="font-size:18px;font-weight:800;color:${r.secrets_found > 0 ? '#ff6b6b' : '#eee'};">${r.secrets_found}</div></div>
      <div style="background:#1a1a24;padding:10px;border-radius:8px;"><div style="font-size:10px;color:#888;">DEPS OUTDATED</div><div style="font-size:18px;font-weight:800;">${r.deps_outdated}</div></div>
    </div>
    ${findingsList ? `<div style="margin-top:20px;"><div style="font-size:11px;color:#888;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;">Top findings</div><ul style="padding-left:20px;margin:0;">${findingsList}</ul></div>` : '<div style="color:#6bcf7f;font-size:13px;">All green. Nothing needs your attention.</div>'}
    ${r.run_url ? `<div style="margin-top:24px;font-size:11px;color:#666;"><a href="${r.run_url}" style="color:#5e81ac;">View full run →</a></div>` : ''}
  </div>
</body></html>`;
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  const ts = auditTypeScript();
  const lint = auditLint();
  const secrets = auditSecrets();
  const deps = auditDeps();

  const findings = [
    ...ts.findings,
    ...lint.findings,
    ...secrets.findings,
    ...deps.findings,
  ];

  const hasErrors = ts.errors > 0 || lint.errors > 0 || secrets.found > 0;
  const hasWarnings = lint.warnings > 0 || deps.outdated > 5;
  const status = hasErrors ? 'errors' : hasWarnings ? 'warnings' : 'clean';

  const summaryBits = [];
  if (ts.errors) summaryBits.push(`${ts.errors} TS error${ts.errors === 1 ? '' : 's'}`);
  if (lint.errors) summaryBits.push(`${lint.errors} lint error${lint.errors === 1 ? '' : 's'}`);
  if (lint.warnings) summaryBits.push(`${lint.warnings} lint warning${lint.warnings === 1 ? '' : 's'}`);
  if (secrets.found) summaryBits.push(`${secrets.found} secret${secrets.found === 1 ? '' : 's'} leaked`);
  if (deps.outdated) summaryBits.push(`${deps.outdated} dep${deps.outdated === 1 ? '' : 's'} outdated`);
  const summary = summaryBits.length ? summaryBits.join(' · ') : 'All checks passed. Nothing to fix.';

  const row = {
    repo: REPO_NAME,
    commit_sha: GITHUB_SHA || null,
    commit_branch: GITHUB_REF_NAME || null,
    status,
    summary,
    ts_errors: ts.errors,
    lint_errors: lint.errors,
    lint_warnings: lint.warnings,
    secrets_found: secrets.found,
    deps_outdated: deps.outdated,
    findings,
    run_url: GITHUB_RUN_URL || null,
    duration_ms: Date.now() - startedAt,
  };

  console.log('[argus] summary:', summary);

  const stored = await postReport(row);
  await sendEmail(stored || { ...row, created_at: new Date().toISOString() });

  // Do NOT fail the workflow on findings — this is a report, not a gate.
  // Charles fixes from the inbox, not by chasing red CI.
  process.exit(0);
}

main().catch(err => {
  console.error('[argus] fatal:', err);
  process.exit(1);
});
