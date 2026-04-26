# AI Subscription Flow — End-to-End Audit

**Date:** 2026-04-26 · **Author:** Claude (taking over from Codex due to usage limit)

The flow being audited:

```
iOS user trial ends
  → mobile TrialEndingBanner / Settings "Manage Subscription" / trial-ending email
  → Safari opens https://propelcoaches.com/billing
    → /billing checks auth + stripe_customer_id
      → has customer → Stripe Customer Portal
      → no customer + AI tier → /pricing?source=ios-billing&plan=ai
    → User picks AI plan → /api/create-checkout-session
      → Stripe checkout (in Safari)
        → User pays
          → Stripe redirects to success_url
            → ??? what now ???
          → stripe-webhook fires checkout.session.completed
            → Profile gets updated
              → Mobile re-fetches on next launch
```

## Per-hop trace

### Hop 1 — Mobile trigger
- `mobile-app/components/TrialEndingBanner.tsx` — opens `https://propelcoaches.com/billing?source=ios-trial-ending&user_id=<id>` via `WebBrowser.openBrowserAsync`
- `mobile-app/app/(tabs)/settings/index.tsx` + `(coach-tabs)/coach-settings/index.tsx` — same URL minus `source` param
- `mobile-app/supabase/functions/cron-trial-ending` — sends email containing `https://propelcoaches.com/billing?source=trial-ending-email`
- ✅ All point at the same endpoint

### Hop 2 — `/billing` route (`web-dashboard/src/app/billing/page.tsx`)
- Auth check via Supabase SSR
- Reads `stripe_customer_id`, `subscription_tier`, `subscription_status`
- Branches:
  - has `stripe_customer_id` → Stripe Customer Portal session created via `createBillingPortalSession()`, redirects there
  - no customer + `classifyTier(subscription_tier) === 'ai'` → `/pricing?source=ios-billing&plan=ai`
  - else → `/pricing?source=billing`
- ✅ Logic is correct
- 🟡 **Note:** the `user_id` query param the mobile sends is logged but never used. Harmless; not a bug.

### Hop 3 — `/pricing?plan=ai`
- Renders AI tier cards (Starter, Pro, Elite) per `web-dashboard/src/app/pricing/pricing-client.tsx`
- "Subscribe" CTA POSTs to `/api/create-checkout-session` with `{ plan: 'ai_pro', billing: 'monthly' }` etc.
- ✅ Wires correctly per Codex commit `115cd82`

### Hop 4 — `/api/create-checkout-session`
File: `web-dashboard/src/app/api/create-checkout-session/route.ts`

- Auth check ✅
- Resolves price ID from canonical `STRIPE_PRICE_AI_*` env vars ✅
- Sets `trial_period_days: 7` for AI plans, 14 for coach ✅
- 🔴 **LAUNCH-BLOCKER #1: `success_url` is `/dashboard?subscription=success`**
  - This is the coach dashboard. AI users have no coach dashboard — landing here is broken UX. They'll see a "no clients" empty state and not know what happened.
  - Should be tier-aware: AI users → `/billing/success` or back to mobile via deep link.
- 🔴 **LAUNCH-BLOCKER #2: metadata key mismatch with stripe-webhook**
  - This route writes `metadata: { coachId, plan, billing }`
  - The Supabase `stripe-webhook` function reads `session.metadata?.userId` and `session.metadata?.planId`
  - Result: **every checkout.session.completed silently fails to update the user's profile.** They pay, the webhook fires, the webhook can't find the user, the profile never gets `stripe_customer_id` or `subscription_tier` set. From the app's perspective, the user is still in their old state.
  - This affects BOTH AI and Coach Stripe signups. Has been broken since the metadata field names diverged.
- 🟡 **Cancel URL is fine** (`/pricing?cancelled=true`)

### Hop 5 — Stripe Checkout (hosted)
- Out of our control — Stripe shows the card form, charges the user, fires events.

### Hop 6 — Stripe redirects to `success_url`
- Currently `/dashboard?subscription=success` (broken — see above)
- No handler interprets the `?subscription=success` query param even on the dashboard route. User just sees the dashboard.
- 🟡 **No mobile deep link.** iOS users started in Safari (via expo-web-browser). After paying, they need a way back to the app. Three options:
  1. Server-side `redirect()` to `propel://billing-success` from a `/billing/success` page (works because `expo-web-browser` accepts custom-scheme returns).
  2. JS-side `window.location = 'propel://billing-success'` after a "Done" button.
  3. Client just closes Safari manually — works but is rough UX.

### Hop 7 — Stripe webhook fires `checkout.session.completed`
File: `mobile-app/supabase/functions/stripe-webhook/index.ts`

- 🔴 **LAUNCH-BLOCKER #2 (cont'd):** reads wrong metadata keys (see Hop 4). Does nothing.
- If keys were right, would write: `stripe_customer_id`, `stripe_subscription_id`, `subscription_status: 'trialing'`, `subscription_tier: planId`.
- 🟡 **Does NOT write `trial_ends_at`** — same banner/email gating issue we just fixed for Apple. Banner won't fire for Stripe trial users either.
- 🟡 **Does NOT write `subscription_source`** — Apple flow writes `'apple'`, Stripe should write `'stripe'`. Useful for debugging and for Customer Portal eligibility.
- ✅ Welcome email logic correctly differentiates AI vs Coach via `planId.startsWith('coach')`.

### Hop 8 — Mobile re-fetch
- AuthContext re-reads profile on:
  - SIGNED_IN event (initial sign-in)
  - Manual `refreshSession()` call
  - Component mount of root layout
- 🟡 **No automatic re-fetch when the user returns from Safari.** They'd need to background/foreground the app, or restart it, to see updated subscription state. Acceptable but not great.
- One mitigation: trigger `refreshSession()` when `WebBrowser.openBrowserAsync` resolves — its result tells us when Safari closed.

---

## Severity-ordered summary

### 🔴 Launch-blockers (must fix before launch)

1. **stripe-webhook metadata key mismatch** — `userId`/`planId` vs `coachId`/`plan`. **Every Stripe-paid signup currently fails to update the profile.** Fix in `mobile-app/supabase/functions/stripe-webhook/index.ts`. (Claude territory.)
2. **`success_url` for AI users** — currently goes to `/dashboard?subscription=success` which doesn't exist for AI users. Fix in `/api/create-checkout-session` with tier-aware success URL.
3. **No `/billing/success` page** — needs to exist as the AI success_url target. Should detect device, render a "Subscription active" confirmation, and offer a deep link back to `propel://billing-success` for iOS users.

### 🟡 Should-fix (broken UX or follow-on bugs)

4. **stripe-webhook doesn't write `trial_ends_at`** — TrialEndingBanner won't fire for Stripe trial users. Fix when fixing #1 (one commit).
5. **stripe-webhook doesn't write `subscription_source = 'stripe'`** — same commit.
6. **Mobile auto-refetch after Safari closes** — small UX win. Use `WebBrowser.openBrowserAsync().then(refreshSession)`. Out of scope for this commit.
7. **DID_CHANGE_RENEWAL_PREF in subscription.updated handler reads `price.nickname`** — assumes the Stripe price has its `nickname` field set to a canonical tier name. Verify by inspecting Stripe Dashboard or extract tier from `price.id` lookup table instead. Out of scope.

### 🟢 Hardening (nice-to-have)

8. **Mobile deep-link return URL** — `propel://` scheme is registered in `mobile-app/app.config.js`. Could add a `propel://billing-success` route handler in expo-router.
9. **Track `source=` analytics** — `/billing` logs but doesn't persist; could write to PostHog when wired.

---

## What this audit fixed

This commit resolves the LAUNCH-BLOCKER items in `web-dashboard/`:
- 🔴 #2 — `success_url` is now tier-aware (AI → `/billing/success`, Coach → `/dashboard?subscription=success`)
- 🔴 #3 — new `/billing/success` route renders confirmation + provides "Open Propel app" deep link for iOS

Stripe-webhook fixes (#1, #4, #5) are committed separately in `mobile-app/` since that's a different repo and a different review surface.

## Follow-on tasks

- [ ] Mobile: add `WebBrowser.openBrowserAsync(...).then(() => refreshSession())` after each `/billing` link tap (3 files: TrialEndingBanner, settings, coach-settings)
- [ ] Mobile: register `propel://billing-success` route handler in expo-router so the deep link from `/billing/success` actually opens the right screen
- [ ] Verify Stripe price `nickname` field is set correctly for all 12 prices (or refactor stripe-webhook to use a price-id → tier map)
- [ ] After Apple IAP secret is set + Stripe test keys swapped, run an end-to-end manual test: sandbox iOS purchase → trial-ending banner appears → tap → Safari → /billing → /pricing?plan=ai → Stripe test checkout → return → /billing/success → "Open Propel" deep link → app re-fetches and shows new tier
