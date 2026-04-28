# Mission Control Hybrid Live Command Center Design

Date: 2026-04-28
Status: Approved for planning

## Context

Mission Control currently works as a standalone HTML command center served by the web dashboard route at `/mission-control`. The route reads `src/data/mission-control.html`, while a separate root-level `mission-control.html` also exists. Most Mission Control state is seeded inside the HTML and then persisted in browser `localStorage` under `mission-control-v8`.

The current implementation feels valuable visually, but it is not trustworthy as an operating layer because its task board and agent workload views do not read the real Supabase-backed task system. The web dashboard already has real tasks in `public.tasks`, including manual tasks and auto-created tasks from check-ins and messages. Mission Control also has limited live wiring for Argus audit reports and git commit events.

## Goal

Create a first real operating layer for Mission Control without rewriting the whole standalone app.

Mission Control v1 should answer:

1. What changed since Charles last looked?
2. What needs Charles's decision today?
3. What is overdue, stale, or blocked?

## Non-Goals

- Do not rebuild Mission Control as React in this slice.
- Do not replace the existing standalone HTML UI.
- Do not make the HTML file write directly to Supabase tables.
- Do not solve every business integration at once.
- Do not remove local notes, local inbox items, or local personal overlays.

## Recommended Approach

Use a hybrid live-read model.

Mission Control remains a standalone HTML app, but it stops treating seeded/local tasks as the only source of truth. A new API route in the Next.js web dashboard will return a normalized live payload from real backend sources. The HTML app will poll that route, merge the live items into its existing dashboard and queue surfaces, and keep local state only for personal overlays and local review status.

## Architecture

### New API Route

Add:

`GET /api/mission-control/live`

The route returns a normalized payload:

```ts
type MissionControlLivePayload = {
  generated_at: string
  tasks: LiveTask[]
  decisions: DecisionItem[]
  activity: ActivityItem[]
  stale: StaleItem[]
}
```

Initial sources:

- `public.tasks`
- `public.audit_reports`
- `public.commit_events`

### Live Task Shape

```ts
type LiveTask = {
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
```

Tasks are read-only in Mission Control v1. The `source_url` points to `/tasks` for all task rows in this slice. Deep links to individual tasks are out of scope until the dashboard has task detail routes.

### Decision Item Shape

```ts
type DecisionItem = {
  id: string
  source: 'supabase_task' | 'audit_report' | 'commit_event' | 'local_overlay'
  title: string
  context: string
  priority: 'low' | 'medium' | 'high'
  created_at: string
  source_url: string | null
  review_key: string
}
```

Decision items include:

- incomplete high-priority tasks
- overdue tasks
- check-in and message tasks
- audit reports with `warnings` or `errors`
- recent commits, if not locally reviewed
- existing local approval queue and inbox items

### Activity Item Shape

```ts
type ActivityItem = {
  id: string
  source: 'audit_report' | 'commit_event' | 'supabase_task'
  title: string
  summary: string
  created_at: string
  source_url: string | null
}
```

Activity items are for the "what changed" view. They should be newest-first and capped in the API.

### Stale Item Shape

```ts
type StaleItem = {
  id: string
  source: 'supabase_task'
  title: string
  reason: string
  age_days: number
  source_url: string
}
```

Initial stale rules:

- incomplete task due before today
- incomplete high-priority task older than 3 days
- incomplete medium-priority task older than 7 days

## Data Flow

1. Mission Control boots from local seeded state as it does today.
2. The HTML app calls `/api/mission-control/live` after initial render.
3. The HTML app stores the latest live payload in memory.
4. The HTML app merges live payload items into:
   - dashboard metrics
   - decision queue
   - task board or mission list
   - agent workload summary where applicable
5. The HTML app polls the live route every 1-2 minutes.
6. Local review state is stored in `localStorage`, keyed by `review_key`, so Charles can file/acknowledge live items without mutating source systems.

## Auth And Security

The `/mission-control` route already gates access to allowed emails. The new live API route should use the same authenticated user check and the same allowed-email policy.

The live route may use the Supabase service role key server-side to read cross-source operational data. The service key must never be exposed to the browser.

The standalone HTML should only call the Next.js API route. It should not call Supabase directly.

## Local Overlay Rules

Local state remains valid for:

- personal notes
- local inbox items manually entered in Mission Control
- local approval/filed status for live items
- local UI preferences

Local state is not valid as the business source of truth for:

- real tasks
- audit reports
- commit history
- customer, billing, or product metrics

## Error Handling

If the live API fails:

- keep the existing local UI usable
- show a subtle "Live feed unavailable" state
- do not clear previously loaded live items from memory during the session
- retry on the next polling interval

If a source table is unavailable:

- return an empty list for that source
- include a source-level warning in the payload if useful
- avoid breaking the whole command center

## Testing

API tests should cover:

- live route rejects unauthenticated users
- live route rejects authenticated users outside the allowlist
- tasks are normalized into `LiveTask`
- overdue and high-priority tasks become `DecisionItem`
- warnings/errors audit reports become `DecisionItem`
- clean audit reports appear in activity but not decisions
- stale rules produce expected `StaleItem` rows

HTML integration tests should cover the pure merge helpers if they are extracted:

- live decisions merge with local queue items
- locally reviewed live items are hidden from the decision queue
- live task counts affect dashboard metrics without duplicating local tasks

## Rollout Plan

1. Add server-side normalization helpers and tests.
2. Add `GET /api/mission-control/live`.
3. Add polling and in-memory live payload handling to Mission Control HTML.
4. Merge live decisions into the existing queue UI.
5. Merge live tasks into dashboard metrics and task/mission views.
6. Add local review state for live items.
7. Verify with local Next.js route and the standalone HTML route.

## Success Criteria

- Mission Control displays real Supabase tasks without manual duplication.
- Incomplete high-priority, overdue, check-in, and message tasks surface in the decision queue.
- Argus warnings/errors and recent commits continue to appear through live feeds.
- Local Mission Control state is clearly treated as a personal overlay.
- The UI remains usable if the live API is temporarily unavailable.
- No direct Supabase credentials or service keys are exposed to the browser.
