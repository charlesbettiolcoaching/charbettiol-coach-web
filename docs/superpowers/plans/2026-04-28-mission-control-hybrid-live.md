# Mission Control Hybrid Live Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Mission Control read real Supabase tasks, audits, and commit events through a single live command-center API, while keeping risky writes local-only for v1.

**Architecture:** Add focused server-side normalization helpers under `src/lib/mission-control/`, expose them through `GET /api/mission-control/live`, then update `src/data/mission-control.html` to poll and merge the live payload into queue, metrics, and task views. The standalone HTML remains the UI shell; the Next.js API becomes the trusted read model.

**Tech Stack:** Next.js App Router route handlers, Supabase REST via service role server-side, small JS helper module with TypeScript payload types, lightweight Node test scripts, standalone HTML/CSS/JS.

---

## File Map

- Create `src/lib/mission-control/types.ts`: shared live payload types.
- Create `src/lib/mission-control/normalizers.js`: pure functions that normalize tasks, audit reports, commit events, and stale/decision rules.
- Create `src/lib/mission-control/normalizers.test.mjs`: lightweight Node test script using `assert`.
- Create `src/app/api/mission-control/live/route.ts`: authenticated allowlisted route that queries Supabase and returns the normalized payload.
- Modify `src/data/mission-control.html`: add live payload state, polling, local review keys, merged queue rendering, dashboard metrics, and live task rendering.
- Modify `package.json`: add a small `test:mission-control` script.

## Task 1: Normalization Helpers

**Files:**
- Create: `src/lib/mission-control/types.ts`
- Create: `src/lib/mission-control/normalizers.js`
- Create: `src/lib/mission-control/normalizers.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add the failing normalization test**

Create `src/lib/mission-control/normalizers.test.mjs`:

```js
import assert from 'node:assert/strict';
import {
  normalizeLiveTask,
  buildTaskDecisionItems,
  buildTaskStaleItems,
  buildAuditDecisionItems,
  buildCommitActivityItems,
} from './normalizers.js';

const now = new Date('2026-04-28T12:00:00.000Z');

const overdueTask = {
  id: 'task-1',
  title: 'Review Sarah check-in',
  description: 'Energy dropped this week',
  due_date: '2026-04-26',
  completed: false,
  priority: 'high',
  source: 'check_in',
  created_at: '2026-04-20T00:00:00.000Z',
  client: { id: 'client-1', name: 'Sarah', email: 'sarah@example.com' },
};

const doneTask = {
  id: 'task-2',
  title: 'Done task',
  description: null,
  due_date: null,
  completed: true,
  priority: 'medium',
  source: 'manual',
  created_at: '2026-04-27T00:00:00.000Z',
  client: null,
};

const liveTask = normalizeLiveTask(overdueTask);
assert.equal(liveTask.id, 'task-1');
assert.equal(liveTask.status, 'open');
assert.equal(liveTask.origin, 'check_in');
assert.equal(liveTask.source_url, '/tasks');

assert.equal(normalizeLiveTask(doneTask).status, 'done');

const decisions = buildTaskDecisionItems([liveTask], now);
assert.equal(decisions.length, 1);
assert.equal(decisions[0].source, 'supabase_task');
assert.equal(decisions[0].priority, 'high');
assert.equal(decisions[0].review_key, 'supabase_task:task-1');

const stale = buildTaskStaleItems([liveTask], now);
assert.equal(stale.length, 1);
assert.equal(stale[0].reason, 'Overdue since 26 Apr 2026');

const audits = buildAuditDecisionItems([
  {
    id: 'audit-1',
    repo: 'web-dashboard',
    status: 'warnings',
    summary: '3 lint warnings',
    created_at: '2026-04-28T08:00:00.000Z',
    run_url: 'https://github.com/example/run',
  },
  {
    id: 'audit-2',
    repo: 'mobile-app',
    status: 'clean',
    summary: 'All checks passed',
    created_at: '2026-04-28T09:00:00.000Z',
    run_url: null,
  },
]);
assert.equal(audits.length, 1);
assert.equal(audits[0].review_key, 'audit_report:audit-1');

const commitActivity = buildCommitActivityItems([
  {
    id: 'commit-1',
    repo: 'mobile-app',
    commit_sha: 'abcdef123456',
    branch: 'main',
    message: 'Fix onboarding flow',
    files_changed: 4,
    insertions: 20,
    deletions: 5,
    created_at: '2026-04-28T10:00:00.000Z',
    commit_url: 'https://github.com/example/commit/abcdef',
  },
]);
assert.equal(commitActivity[0].id, 'commit-commit-1');
assert.equal(commitActivity[0].summary, '+20 / -5 across 4 files');

console.log('mission-control normalizers ok');
```

- [ ] **Step 2: Add the test script**

Modify `package.json` scripts:

```json
"test:mission-control": "node src/lib/mission-control/normalizers.test.mjs"
```

- [ ] **Step 3: Run the test to verify it fails**

Run:

```bash
npm run test:mission-control
```

Expected: FAIL with `Cannot find module './normalizers.js'` or missing export errors.

- [ ] **Step 4: Add shared types**

Create `src/lib/mission-control/types.ts`:

```ts
export type LiveTask = {
  id: string
  source: 'supabase_task'
  title: string
  description: string | null
  status: 'open' | 'done'
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  created_at: string
  client: { id: string; name: string | null; email: string | null } | null
  origin: 'manual' | 'check_in' | 'message' | 'unknown'
  source_url: string
}

export type DecisionItem = {
  id: string
  source: 'supabase_task' | 'audit_report' | 'commit_event' | 'local_overlay'
  title: string
  context: string
  priority: 'low' | 'medium' | 'high'
  created_at: string
  source_url: string | null
  review_key: string
}

export type ActivityItem = {
  id: string
  source: 'audit_report' | 'commit_event' | 'supabase_task'
  title: string
  summary: string
  created_at: string
  source_url: string | null
}

export type StaleItem = {
  id: string
  source: 'supabase_task'
  title: string
  reason: string
  age_days: number
  source_url: string
}

export type MissionControlLivePayload = {
  generated_at: string
  tasks: LiveTask[]
  decisions: DecisionItem[]
  activity: ActivityItem[]
  stale: StaleItem[]
}
```

- [ ] **Step 5: Add minimal implementation**

Create `src/lib/mission-control/normalizers.js`. The repo already has `allowJs: true`, so the Next.js route can import this module, while the Node test can execute it directly.

```js
const VALID_PRIORITY = new Set(['low', 'medium', 'high'])
const VALID_ORIGIN = new Set(['manual', 'check_in', 'message'])

export function normalizeLiveTask(row) {
  const priority = VALID_PRIORITY.has(row.priority) ? row.priority : 'medium'
  const origin = VALID_ORIGIN.has(row.source) ? row.source : 'unknown'
  return {
    id: String(row.id),
    source: 'supabase_task',
    title: String(row.title || 'Untitled task'),
    description: row.description ?? null,
    status: row.completed ? 'done' : 'open',
    priority,
    due_date: row.due_date ?? null,
    created_at: row.created_at || new Date(0).toISOString(),
    client: row.client ? {
      id: String(row.client.id),
      name: row.client.name ?? null,
      email: row.client.email ?? null,
    } : null,
    origin,
    source_url: '/tasks',
  }
}

export function buildTaskDecisionItems(tasks, now = new Date()) {
  return tasks
    .filter(task => task.status === 'open')
    .filter(task => task.priority === 'high' || isOverdue(task, now) || task.origin === 'check_in' || task.origin === 'message')
    .map(task => ({
      id: `decision-task-${task.id}`,
      source: 'supabase_task',
      title: task.title,
      context: taskContext(task, now),
      priority: task.priority === 'high' || isOverdue(task, now) ? 'high' : 'medium',
      created_at: task.created_at,
      source_url: task.source_url,
      review_key: `supabase_task:${task.id}`,
    }))
}

export function buildTaskStaleItems(tasks, now = new Date()) {
  return tasks
    .filter(task => task.status === 'open')
    .map(task => staleReason(task, now))
    .filter(Boolean)
}

export function buildAuditDecisionItems(reports) {
  return reports
    .filter(report => report.status === 'warnings' || report.status === 'errors')
    .map(report => ({
      id: `decision-audit-${report.id}`,
      source: 'audit_report',
      title: `${report.status === 'errors' ? 'Audit errors' : 'Audit warnings'} · ${report.repo}`,
      context: String(report.summary || 'Audit needs review'),
      priority: report.status === 'errors' ? 'high' : 'medium',
      created_at: report.created_at || new Date(0).toISOString(),
      source_url: report.run_url ?? null,
      review_key: `audit_report:${report.id}`,
    }))
}

export function buildAuditActivityItems(reports) {
  return reports.map(report => ({
    id: `audit-${report.id}`,
    source: 'audit_report',
    title: `Argus · ${report.repo} · ${report.status}`,
    summary: String(report.summary || ''),
    created_at: report.created_at || new Date(0).toISOString(),
    source_url: report.run_url ?? null,
  }))
}

export function buildCommitActivityItems(commits) {
  return commits.map(commit => ({
    id: `commit-${commit.id}`,
    source: 'commit_event',
    title: `${commit.repo} · ${(commit.commit_sha || '').slice(0, 7)} · ${(commit.message || '').split('\n')[0]}`,
    summary: `+${commit.insertions || 0} / -${commit.deletions || 0} across ${commit.files_changed || 0} files`,
    created_at: commit.created_at || new Date(0).toISOString(),
    source_url: commit.commit_url ?? null,
  }))
}

function isOverdue(task, now) {
  if (!task.due_date) return false
  const due = new Date(`${task.due_date}T23:59:59.999Z`)
  return due.getTime() < now.getTime()
}

function taskContext(task, now) {
  const client = task.client?.name || task.client?.email
  const bits = []
  if (client) bits.push(`Client: ${client}`)
  if (task.origin !== 'unknown') bits.push(`Origin: ${task.origin.replace('_', ' ')}`)
  if (task.due_date && isOverdue(task, now)) bits.push(`Overdue since ${formatDate(task.due_date)}`)
  if (task.description) bits.push(task.description)
  return bits.join(' · ') || 'Open task needs review.'
}

function staleReason(task, now) {
  const created = new Date(task.created_at)
  const ageDays = Math.max(0, Math.floor((startOfUtcDay(now).getTime() - startOfUtcDay(created).getTime()) / 86400000))
  if (task.due_date && isOverdue(task, now)) {
    return { id: `stale-task-${task.id}`, source: 'supabase_task', title: task.title, reason: `Overdue since ${formatDate(task.due_date)}`, age_days: ageDays, source_url: task.source_url }
  }
  if (task.priority === 'high' && ageDays >= 3) {
    return { id: `stale-task-${task.id}`, source: 'supabase_task', title: task.title, reason: `High priority open for ${ageDays} days`, age_days: ageDays, source_url: task.source_url }
  }
  if (task.priority === 'medium' && ageDays >= 7) {
    return { id: `stale-task-${task.id}`, source: 'supabase_task', title: task.title, reason: `Medium priority open for ${ageDays} days`, age_days: ageDays, source_url: task.source_url }
  }
  return null
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function formatDate(value) {
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}
```

- [ ] **Step 6: Run test to verify it passes**

Run:

```bash
npm run test:mission-control
```

Expected: PASS with `mission-control normalizers ok`.

- [ ] **Step 7: Commit**

```bash
git add package.json src/lib/mission-control
git commit -m "Add Mission Control live normalizers"
```

## Task 2: Live API Route

**Files:**
- Create: `src/app/api/mission-control/live/route.ts`

- [ ] **Step 1: Write route shell after helper tests are green**

Create `src/app/api/mission-control/live/route.ts`:

```ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import {
  buildAuditActivityItems,
  buildAuditDecisionItems,
  buildCommitActivityItems,
  buildTaskDecisionItems,
  buildTaskStaleItems,
  normalizeLiveTask,
} from '@/lib/mission-control/normalizers'
import type { MissionControlLivePayload } from '@/lib/mission-control/types'

const ALLOWED_EMAILS = new Set<string>([
  'charlesbettiolbusiness@gmail.com',
  'charlesbettiolcoaching@gmail.com',
])

export async function GET() {
  const auth = await getAllowedUser()
  if (!auth.ok) return auth.response

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: 'Mission Control live source unavailable' }, { status: 503 })
  }

  const [tasks, audits, commits] = await Promise.all([
    fetchSupabase(url, key, 'tasks?select=*,client:profiles!tasks_client_id_fkey(id,name,email)&order=created_at.desc&limit=100'),
    fetchSupabase(url, key, 'audit_reports?select=*&order=created_at.desc&limit=30'),
    fetchSupabase(url, key, 'commit_events?select=*&order=created_at.desc&limit=50'),
  ])

  const liveTasks = (Array.isArray(tasks) ? tasks : []).map(normalizeLiveTask)
  const auditRows = Array.isArray(audits) ? audits : []
  const commitRows = Array.isArray(commits) ? commits : []

  const payload: MissionControlLivePayload = {
    generated_at: new Date().toISOString(),
    tasks: liveTasks,
    decisions: [
      ...buildTaskDecisionItems(liveTasks),
      ...buildAuditDecisionItems(auditRows),
    ].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)),
    activity: [
      ...buildAuditActivityItems(auditRows),
      ...buildCommitActivityItems(commitRows),
    ].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 80),
    stale: buildTaskStaleItems(liveTasks),
  }

  return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } })
}

async function getAllowedUser(): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!ALLOWED_EMAILS.has(user.email ?? '')) return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { ok: true }
}

async function fetchSupabase(url: string, key: string, path: string): Promise<unknown[]> {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: 'no-store',
  })
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : []
}
```

- [ ] **Step 2: Type-check the route**

Run:

```bash
npx tsc --noEmit --pretty false
```

Expected: no new Mission Control type errors. Existing unrelated errors, if any, must be recorded before proceeding.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/mission-control/live/route.ts
git commit -m "Add Mission Control live API route"
```

## Task 3: HTML Live Polling And Local Review State

**Files:**
- Modify: `src/data/mission-control.html`

- [ ] **Step 1: Add live state and local review helpers**

Near the existing `STORAGE_KEY`, add:

```js
const LIVE_REVIEW_KEY = 'mission-control-live-reviewed-v1';
const LIVE_POLL_MS = 90 * 1000;
let livePayload = { generated_at: null, tasks: [], decisions: [], activity: [], stale: [] };

function loadReviewedLiveKeys() {
  try { return new Set(JSON.parse(localStorage.getItem(LIVE_REVIEW_KEY) || '[]')); }
  catch { return new Set(); }
}

function saveReviewedLiveKeys(keys) {
  localStorage.setItem(LIVE_REVIEW_KEY, JSON.stringify([...keys]));
}

function markLiveReviewed(reviewKey) {
  if (!reviewKey) return;
  const keys = loadReviewedLiveKeys();
  keys.add(reviewKey);
  saveReviewedLiveKeys(keys);
  renderQueue();
  renderDashboard();
}

function unreviewedLiveDecisions() {
  const reviewed = loadReviewedLiveKeys();
  return (livePayload.decisions || []).filter(item => !reviewed.has(item.review_key));
}
```

- [ ] **Step 2: Add live fetch function**

Near existing live feed functions, add:

```js
async function loadMissionLive({ silent = true } = {}) {
  try {
    const res = await fetch(`${MC_API_BASE}/api/mission-control/live`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`live ${res.status}`);
    const data = await res.json();
    livePayload = {
      generated_at: data.generated_at || new Date().toISOString(),
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
      decisions: Array.isArray(data.decisions) ? data.decisions : [],
      activity: Array.isArray(data.activity) ? data.activity : [],
      stale: Array.isArray(data.stale) ? data.stale : [],
    };
    renderDashboard();
    renderQueue();
    renderTasks();
    renderActivity();
  } catch (err) {
    if (!silent) console.debug('[mission-live] fetch failed:', err?.message || err);
  }
}
```

- [ ] **Step 3: Wire boot polling**

At boot, add:

```js
loadMissionLive({ silent: true });
setInterval(() => loadMissionLive({ silent: false }), LIVE_POLL_MS);
```

- [ ] **Step 4: Manual browser smoke check**

Run:

```bash
npm run dev
```

Open `/mission-control` in an authenticated browser session and verify no console crash occurs when `/api/mission-control/live` returns 401/403/200.

- [ ] **Step 5: Commit**

```bash
git add src/data/mission-control.html
git commit -m "Poll Mission Control live payload"
```

## Task 4: Merge Live Decisions And Real Tasks Into Existing Views

**Files:**
- Modify: `src/data/mission-control.html`

- [ ] **Step 1: Update queue merge**

In `renderQueue()`, include:

```js
const liveDecisionItems = unreviewedLiveDecisions().map(item => ({
  source: 'live',
  id: item.id,
  title: item.title,
  context: item.context,
  agentId: item.source === 'audit_report' ? 'ag-argus' : item.source === 'commit_event' ? 'ag-dex' : 'ag-bill',
  createdAt: Date.parse(item.created_at) || Date.now(),
  reviewKey: item.review_key,
  sourceUrl: item.source_url,
}));
```

Merge `liveDecisionItems` with local queue and pending inbox items. For approve/file actions on `source === 'live'`, call `markLiveReviewed(q.reviewKey)` and open `q.sourceUrl` in a new tab if the user chooses the source link.

- [ ] **Step 2: Update dashboard metrics**

In `renderDashboard()`, calculate:

```js
const liveOpenTasks = (livePayload.tasks || []).filter(t => t.status === 'open').length;
const livePending = unreviewedLiveDecisions().length;
const liveStale = (livePayload.stale || []).length;
```

Add those counts to the existing pending and priority metrics without double-counting local queue items.

- [ ] **Step 3: Update task rendering**

In `renderTasks()`, render local tasks as today plus a separate "Live Tasks" block or cards in the relevant status columns. Live tasks must be visually marked as `live` and read-only. Clicking a live task opens `/tasks`.

- [ ] **Step 4: Manual browser verification**

Run the dev server and verify:

```bash
npm run dev
```

Check:

- `/api/mission-control/live` returns JSON when authenticated and allowlisted.
- `/mission-control` shows live task counts.
- Local approve/file hides a live decision after refresh.
- Refreshing the browser preserves local reviewed state.

- [ ] **Step 5: Commit**

```bash
git add src/data/mission-control.html
git commit -m "Merge live Mission Control items into queue"
```

## Task 5: Final Verification

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run helper tests**

```bash
npm run test:mission-control
```

Expected: `mission-control normalizers ok`.

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit --pretty false
```

Expected: no new errors from Mission Control files.

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: build completes, or any unrelated pre-existing failures are documented with exact output.

- [ ] **Step 4: Inspect diff**

```bash
git diff --stat HEAD
git status --short
```

Expected: only planned Mission Control files changed, plus any pre-existing unrelated changes clearly identified.

- [ ] **Step 5: Commit final verification note if needed**

If verification required small fixes, stage the specific fixed files reported by `git status --short`:

```bash
git add src/lib/mission-control/normalizers.js src/app/api/mission-control/live/route.ts src/data/mission-control.html
git commit -m "Verify Mission Control live command center"
```
