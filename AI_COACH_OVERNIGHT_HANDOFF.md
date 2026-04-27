# AI Coach — Overnight Build Handoff

Built overnight while Charles was sleeping. Every change compiles clean
(`npx next build` → 0 errors, 0 warnings).

## The Big Idea

Competitors ship AI as a **feature** tacked onto a dashboard. Propel now has
something different: **a coherent AI co-pilot experience** with its own visual
signature, its own command surface, its own mission-control hub, and a
transparency philosophy that makes the AI trustworthy instead of mysterious.

Three things that competitors don't do that you now do:

1. **Every AI output shows confidence + reasoning.** Click to expand. No more
   black-box recommendations.
2. **A command palette (⌘K) that speaks natural language.** Coach types
   "who's gone quiet?" and gets a live answer from Claude, scoped to their
   roster only.
3. **A time-saved meter with a real receipt.** "14 tasks handled · saved 1h 52m
   · ≈ $187 at $100/hr." Not vanity metrics — derived from actual AI actions.

## What to try first

1. Log in. On any page, hit **⌘K** (Mac) or **Ctrl+K** (Win). That's the
   Command Palette. Type a client name, a page name, or press **Tab** for
   AI mode.
2. In the sidebar, the new **AI COACH** group is at the top (above Clients).
   Open **Mission Control** — the new `/ai-coach` page.
3. Notice the **orb**: it breathes in idle, spins faster when the AI is
   thinking, emits a ring pulse when it's "speaking". It's a reusable
   component (`<AIOrb size="lg" state="thinking" />`) that replaces every
   spinner across the AI pages.
4. Open AI Reviews, expand any row — scroll down to see the **"Why the AI
   suggested this"** block. Deterministic reasoning + confidence + alternatives.
5. On the Dashboard home, there's now a **Mission Control banner** at the top
   with a direct link into the hub + an Ask AI button.

## New files

### Components (`src/components/ai/`)
- `AIOrb.tsx` — signature visual. 4 sizes, 3 states.
- `AIConfidenceBadge.tsx` — "82% · High" with tiered icons.
- `AIReasoningBlock.tsx` — expandable "why" block: reasoning, signals, alternatives.
- `AIThinkingIndicator.tsx` — orb + cycling stage labels ("Reading check-ins…").
- `AIBriefingCard.tsx` — daily briefing widget with typewriter reveal.
- `AIAuditFeed.tsx` — transparent log of every AI action.
- `CoachTimeSavedMeter.tsx` — animated counter + progress to weekly target.
- `PriorityQueueCard.tsx` — top N decisions, with urgency scoring + confidence.
- `RosterPillarHealth.tsx` — 5-pillar dial visualisation (Stimulus / Fatigue /
  Adherence / Time horizon / Risk — mirrors your mobile AI Coach decision engine).
- `TypeIn.tsx` — typewriter reveal with blinking caret.

### Global UI
- `src/components/CommandPalette.tsx` — the ⌘K palette itself.
- `src/components/CommandPaletteProvider.tsx` — context + global keyboard shortcut.
- `src/lib/nav-catalog.ts` — single source of truth for nav items, used by
  Sidebar AND Command Palette. Adding a page in one place updates both.

### New page
- `src/app/(dashboard)/ai-coach/page.tsx` — Mission Control hub. Assembles
  briefing, time-saved, priority queue, pillar health, audit feed, jump tiles.

### New API routes
- `src/app/api/ai-coach/mission-control/route.ts` — aggregates signals +
  concerns + AI logs into one payload; builds the priority queue, pillar scores,
  and time-saved estimate. Deterministic, no Claude calls.
- `src/app/api/ai-coach/briefing/route.ts` — generates the daily briefing via
  Claude Haiku 4.5. Falls back to a rule-based briefing if `ANTHROPIC_API_KEY`
  isn't set (common in local dev). Always returns 200.
- `src/app/api/ai-coach/ask/route.ts` — Command Palette's natural-language Q&A.
  Calls Claude Haiku 4.5 with a compact pre-aggregated roster summary (no raw
  PII).

## Modified files

- `tailwind.config.ts` — new keyframes: `orbBreathe`, `orbRotate`, `orbShift`,
  `orbHalo`, `slideInUp`, `caret`. Animations registered: `orb-breathe`,
  `orb-rotate`, `orb-shift`, `orb-halo`, `slide-in-up`, `caret`.
- `src/app/globals.css` — (from the earlier animation pass) `.stagger-children`,
  `.card-lift`, `.press`, `.ai-shimmer-text`, `.ai-thinking-dot`, `.ai-glow`.
- `src/components/DashboardShell.tsx` — wraps children in
  `CommandPaletteProvider`; adds page-transition fade on route change.
- `src/components/Sidebar.tsx` — uses shared nav catalog; AI COACH group gets a
  subtle gradient + ping dot; active AI items pulse.
- `src/components/TopBar.tsx` — old decorative "Search…" replaced with a real
  **command palette trigger button** showing the ⌘K hint. Mobile shows a
  Sparkles icon.
- `src/app/(dashboard)/dashboard/page.tsx` — new `AICoachBanner` component
  promoting the Mission Control hub.
- `src/app/(dashboard)/ai-reviews/page.tsx` — AIOrb hero, AIThinkingIndicator
  on load, `AIReasoningBlock` inside every expanded row (reasoning +
  confidence + signals derived deterministically from the check-in data).
- `src/app/(dashboard)/intelligence/page.tsx` — AIOrb hero, AIThinkingIndicator
  on load, AIConfidenceBadge under every AI-generated client insight.
- `src/app/(dashboard)/concerns/page.tsx` — AIOrb hero, AIThinkingIndicator on
  load, AIConfidenceBadge next to every AI reasoning block (scaled by severity).

## Design philosophy baked in

1. **"What should I do right now?" on every surface.** The Mission Control hub
   has a singular answer. The priority queue is ordered by urgency. The Command
   Palette responds to action-oriented questions.
2. **Transparent AI.** Every output shows confidence + reasoning. Fallback
   briefings are explicitly labelled ("Rule-based briefing — AI not configured").
3. **Specific numbers, no hype.** "1h 52m saved", not "significantly more
   efficient". "82% confidence based on 3 signals", not "high confidence".
4. **Anti-spinner.** The AIOrb replaces every generic spinner on AI surfaces.
   It's not just prettier — it's a consistent signal that the AI is working.

## Things I deliberately did NOT do

- **I didn't stream the AI response.** The `/api/ai-coach/ask` endpoint
  returns the full answer. Streaming would feel even more alive but requires
  SSE + client parsing; not overnight-shippable without bugs.
- **I didn't wire up authentication to the cron jobs.** The new `/api/ai-coach/*`
  endpoints require a logged-in coach, so they can't run as unauthenticated
  crons. Fine for today — they're called from the UI.
- **I didn't touch the mobile app.** Everything here is web-dashboard. The
  mobile app AI Coach tier should get its own pass, with React Native
  equivalents of these primitives.
- **I didn't cache the briefing.** Every load regenerates. Low traffic for now,
  but consider caching per-coach-per-day in a `coach_briefings` table before
  launch to save tokens.

## Graceful degradation checklist

Every new piece was built to not crash when dependencies are missing:

- No `ANTHROPIC_API_KEY`? → Briefing uses the deterministic fallback; Ask AI
  returns an explanatory message, not an error.
- `ai_agent_logs` table empty? → Audit feed shows an empty-state message.
- `ai_coach_concerns` table empty? → Safety count shows 0, "All clear".
- `get_client_signals` RPC missing? → The hub still renders with default
  pillar scores and empty priority queue.
- Brand-new coach with 0 clients? → Pillar health shows zeroed dials with
  "No data yet" hints; banner still invites them into the hub.

## Quick test ideas

With Supabase env vars set in `.env.local`:
1. `npm run dev` → open `http://localhost:3000/dashboard`
2. Hit ⌘K — verify the palette slides in, try typing a nav page name, press
   Enter.
3. Press Tab to switch to AI mode, type a question, press Enter.
4. Navigate to `/ai-coach` — verify orb, briefing, time-saved meter, priority
   queue all render.
5. On `/ai-reviews` — if you have any review rows, expand one and scroll to
   the "Why the AI suggested this" block.
6. In the sidebar, notice the AI COACH group's ping-dot and the gradient.

## If something doesn't feel right

Most likely suspects:
- **Briefing always shows the fallback**: `ANTHROPIC_API_KEY` isn't set in
  `.env.local`, or the Claude model name in `briefing/route.ts` /
  `ask/route.ts` is newer than what your Anthropic key supports.
- **Mission Control numbers all 0**: the three Supabase tables
  (`ai_agent_logs`, `ai_coach_concerns`, `get_client_signals`) might be
  empty or missing. The page doesn't crash — you'll just see zeros.
- **⌘K doesn't open anywhere**: make sure the current page is under
  `(dashboard)` route group. The provider is only mounted there; public
  pages won't have it.

## Where to go next

Ideas that would further cement the moat:
1. **Per-client AI Context Card** — small side panel in Messages that shows
   everything the AI knows about the current client. Saves 30s per reply.
2. **Celebrate moments auto-detection** — AI scans for PRs, streaks, goal-weight
   achievements and surfaces a "celebrate with them" prompt in the briefing.
3. **"Focus mode"** — click a priority queue item, enter a step-by-step
   workflow (context → recommendation → approve/edit → next).
4. **Voice briefings** — `/api/ai-coach/briefing-audio` returns an ElevenLabs
   MP3 for coaches commuting.
5. **Coach weekly report** — Sunday email powered by the same mission-control
   data.

All of these plug into existing primitives (AIOrb, ReasoningBlock, etc) —
no new foundations needed.
