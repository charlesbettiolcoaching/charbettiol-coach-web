# Mission Control Overnight Handoff

Date: 2026-04-29

## What Changed

Mission Control has moved from a mostly-local visual command center to a backend-backed operating layer.

- Live Supabase tasks, audit reports, and commit activity flow through `GET /api/mission-control/live`.
- Live approve/veto actions flow through `POST /api/mission-control/actions`.
- Approved live task decisions mark the real Supabase task as completed.
- Vetoed or approved live items are recorded in `mission_control_reviews` so they stop resurfacing after refresh.
- Reviewed action history is returned in the live payload and shown in the activity feed.
- The queue header now shows live sync health, last successful refresh, live open task count, and reviewed count.
- Failed live actions show the API error inline on the queue item and log a visible failure event.
- Stale live tasks now appear in the dashboard Top Priorities panel.
- The duplicate root-level standalone `mission-control.html` was mechanically synced from `web-dashboard/src/data/mission-control.html`.

## Files To Know

- `src/app/api/mission-control/live/route.ts`: live read model.
- `src/app/api/mission-control/actions/route.ts`: persistent approve/veto endpoint.
- `src/lib/mission-control/normalizers.mjs`: pure normalization for tasks, audits, commits, and stale rules.
- `src/lib/mission-control/actions.mjs`: pure validation and review-history helpers.
- `src/data/mission-control.html`: standalone Mission Control UI.
- `supabase/migrations/20260428_mission_control_reviews.sql`: persistence table for reviewed live items.

## Production Step Required

Apply `supabase/migrations/20260428_mission_control_reviews.sql` to the Supabase project before relying on persistent approve/veto in production.

Without that migration, Mission Control still reads live tasks and audits, but action persistence will fail because `mission_control_reviews` does not exist.

## Verification Run

- `npm run test:mission-control`
- Mission Control inline HTML script parse
- `npx tsc --noEmit --pretty false`
- `npm run build`
- Local unauthenticated smoke:
  - `/mission-control` redirects to `/login?redirect=/mission-control`
  - `/api/mission-control/live` returns `401 Unauthorized`
  - `/api/mission-control/actions` returns `401 Unauthorized`

## Remaining High-Value Follow-Ups

- Add a task detail route so Mission Control can deep-link to individual tasks instead of `/tasks`.
- Add a Supabase realtime channel or shorter cache-aware polling if 90 seconds still feels too slow.
- Add an authenticated browser test using a real session cookie to verify live approve/veto end-to-end against Supabase.
- Decide whether vetoing a Supabase task should leave it open, archive it, or create a separate "dismissed" status in the task schema.
