#!/usr/bin/env node
// Posts every commit in a push to Supabase.commit_events.
// Runs in GitHub Actions on `push: branches ['**']`. Idempotent on
// (repo, commit_sha) — re-runs are safe.

import { execSync } from 'node:child_process';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  REPO_NAME,
  GITHUB_EVENT_BEFORE = '',
  GITHUB_EVENT_AFTER = '',
  GITHUB_SHA = '',
  GITHUB_REF_NAME = 'unknown',
  GITHUB_SERVER_URL = 'https://github.com',
  GITHUB_REPOSITORY = '',
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.log('[commit-tracker] Supabase env missing, skipping');
  process.exit(0);
}
if (!REPO_NAME) {
  console.error('[commit-tracker] REPO_NAME env is required');
  process.exit(1);
}

const afterSha = GITHUB_EVENT_AFTER || GITHUB_SHA;
const beforeSha = GITHUB_EVENT_BEFORE;
const NULL_SHA = '0000000000000000000000000000000000000000';

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8' });
}

// Figure out which commits to log. New branches and force-pushes get
// special handling so we don't spam history on a first push.
let range;
if (!beforeSha || beforeSha === NULL_SHA) {
  // Brand new branch — only log commits that aren't already on main.
  try {
    sh('git rev-parse --verify origin/main');
    range = `origin/main..${afterSha}`;
  } catch {
    try {
      sh('git rev-parse --verify main');
      range = `main..${afterSha}`;
    } catch {
      range = `${afterSha}~1..${afterSha}`;
    }
  }
} else {
  range = `${beforeSha}..${afterSha}`;
}

let shas;
try {
  shas = sh(`git log --format=%H ${range}`).trim().split('\n').filter(Boolean);
} catch (err) {
  console.error('[commit-tracker] git log failed:', err?.message || err);
  process.exit(0);
}

if (!shas.length) {
  console.log('[commit-tracker] No new commits in range');
  process.exit(0);
}

console.log(`[commit-tracker] ${REPO_NAME} · ${shas.length} commit(s) in ${range}`);

let ok = 0, failed = 0;
for (const sha of shas) {
  try {
    const meta = sh(`git show -s --format=%H%n%s%n%an%n%ae%n%at ${sha}`)
      .trim().split('\n');
    const [fullSha, message, authorName, authorEmail, timestamp] = meta;

    const numstat = sh(`git show --numstat --format= ${sha}`)
      .trim().split('\n').filter(Boolean);

    let insertions = 0, deletions = 0;
    const files = [];
    for (const line of numstat) {
      const parts = line.split('\t');
      if (parts.length < 3) continue;
      const ins = parts[0] === '-' ? 0 : parseInt(parts[0], 10) || 0;
      const del = parts[1] === '-' ? 0 : parseInt(parts[1], 10) || 0;
      insertions += ins;
      deletions += del;
      files.push(parts[2]);
    }

    const row = {
      repo: REPO_NAME,
      commit_sha: fullSha,
      branch: GITHUB_REF_NAME,
      author_name: authorName,
      author_email: authorEmail,
      message,
      files_changed: files.length,
      insertions,
      deletions,
      files,
      commit_url: GITHUB_REPOSITORY
        ? `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/commit/${fullSha}`
        : null,
      created_at: new Date(parseInt(timestamp, 10) * 1000).toISOString(),
    };

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/commit_events?on_conflict=repo,commit_sha`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: 'resolution=ignore-duplicates,return=minimal',
        },
        body: JSON.stringify(row),
      },
    );

    if (!res.ok) {
      failed++;
      console.error('[commit-tracker]', sha.slice(0, 7), 'failed:', res.status, await res.text());
    } else {
      ok++;
      console.log('[commit-tracker] posted', sha.slice(0, 7), '—', message.slice(0, 60));
    }
  } catch (err) {
    failed++;
    console.error('[commit-tracker]', sha, 'error:', err?.message || err);
  }
}

console.log(`[commit-tracker] done · ${ok} posted · ${failed} failed`);
process.exit(0);
