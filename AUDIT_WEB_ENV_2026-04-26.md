# Web Env + Stripe/Vercel Audit — 2026-04-26

Scope: read-only audit of `web-dashboard/`. No code, `.env.local`, Stripe CLI, Vercel, or dashboard changes were made.

Notes:
- I did not copy any secret values into this file.
- `.env.local` currently has `STRIPE_SECRET_KEY` with an `sk_live_` prefix and `STRIPE_PUBLISHABLE_KEY` with a `pk_live_` prefix.
- Stripe price IDs use the generic `price_` prefix, so test vs live cannot be inferred from the price ID alone. Given the local secret key is live, local Stripe execution would run in live mode.

## 1. Stripe Env Inventory

Every `STRIPE_*` token referenced under `web-dashboard/src/` is listed below. `STRIPE_BASE` also appears, but it is a local constant in `src/lib/stripe.ts`, not an environment variable.

| Env var | Source references | Required vs optional | Local mode / presence | AU generated price exists? | Notes |
|---|---:|---|---|---|---|
| `STRIPE_SECRET_KEY` | 10 | Required for all Stripe API access | Present, live secret | n/a | Used by `src/lib/stripe.ts`, checkout, portal, invoices, payments, subscriptions, marketplace, and webhook routes. |
| `STRIPE_WEBHOOK_SECRET` | 4 | Required for Stripe webhook routes | Present, webhook secret | n/a | Used by both `src/app/api/stripe/webhook/route.ts` and `src/app/api/webhooks/stripe/route.ts`. |
| `STRIPE_PRICE_AI_STARTER` | 1 | Required if `/api/stripe/checkout` supports AI Starter web checkout | Present, price ID | Yes | New AU generated var exists in root `.env.stripe.au-2026-04-26.generated`. |
| `STRIPE_PRICE_AI_PRO` | 1 | Required if `/api/stripe/checkout` supports AI Pro web checkout | Present, price ID | Yes | New AU generated var exists. |
| `STRIPE_PRICE_AI_ELITE` | 1 | Required if `/api/stripe/checkout` supports AI Elite web checkout | Present, price ID | Yes | New AU generated var exists. |
| `STRIPE_PRICE_COACH_STARTER` | 1 | Required for `/api/stripe/checkout` Coach Starter | Present, price ID | Yes | New AU generated var exists. |
| `STRIPE_PRICE_COACH_PRO` | 1 | Required for `/api/stripe/checkout` Coach Pro | Present, price ID | Yes | New AU generated var exists. |
| `STRIPE_PRICE_COACH_SCALE` | 1 | Required for `/api/stripe/checkout` Coach Scale | Present, price ID | Yes | New AU generated var exists. |
| `STRIPE_PRICE_STARTER_MONTHLY` | 1 | Required only by legacy `/api/create-checkout-session` if using `starter` monthly | Not present in `.env.local` | No | Legacy route falls back to `STRIPE_PRICE_STARTER`. |
| `STRIPE_PRICE_STARTER_ANNUAL` | 1 | Required only by legacy `/api/create-checkout-session` if using `starter` annual | Not present in `.env.local` | No | Legacy route falls back to `STRIPE_PRICE_STARTER`. |
| `STRIPE_PRICE_PRO_MONTHLY` | 1 | Required only by legacy `/api/create-checkout-session` if using `pro` monthly | Not present in `.env.local` | No | Legacy route falls back to `STRIPE_PRICE_PRO`. |
| `STRIPE_PRICE_PRO_ANNUAL` | 1 | Required only by legacy `/api/create-checkout-session` if using `pro` annual | Not present in `.env.local` | No | Legacy route falls back to `STRIPE_PRICE_PRO`. |
| `STRIPE_PRICE_TEAM_MONTHLY` | 1 | Required only by legacy `/api/create-checkout-session` if using `team` monthly | Not present in `.env.local` | No | Legacy route falls back to `STRIPE_PRICE_CLINIC`. |
| `STRIPE_PRICE_TEAM_ANNUAL` | 1 | Required only by legacy `/api/create-checkout-session` if using `team` annual | Not present in `.env.local` | No | Legacy route falls back to `STRIPE_PRICE_CLINIC`. |
| `STRIPE_PRICE_STARTER` | 3 | Legacy fallback, still referenced | Present, price ID | No | Pre-AU variable. Still used by legacy checkout and legacy webhook tier map. |
| `STRIPE_PRICE_PRO` | 3 | Legacy fallback, still referenced | Present, price ID | No | Pre-AU variable. Still used by legacy checkout and legacy webhook tier map. |
| `STRIPE_PRICE_CLINIC` | 1 | Legacy fallback, still referenced | Present, price ID | No | Pre-AU variable. Used as `team` fallback in legacy checkout route. |
| `STRIPE_PRICE_ELITE` | 1 | Legacy webhook mapping only | Not present in `.env.local` | No | Referenced in `src/app/api/webhooks/stripe/route.ts`, but not part of the AU generated file. |
| `STRIPE_COUPON_COACH_B2C_30OFF` | 2 | Optional | Not present in `.env.local` | n/a | Used by referral-code API as nullable coupon metadata. `setup-stripe-products.sh` appears to generate it. |

Present in `.env.local` but not referenced under `web-dashboard/src/`:
- `STRIPE_PUBLISHABLE_KEY` — present and live publishable, but no current `src/` reference found.
- Annual AU vars: `STRIPE_PRICE_AI_*_ANNUAL` and `STRIPE_PRICE_COACH_*_ANNUAL` are present and generated, but no current `src/` route uses them.

## 2. Legacy Stripe Vars To Delete

Requested legacy vars:

| Var | Grep result under `web-dashboard/src/` | Delete now? | Why |
|---|---:|---|---|
| `STRIPE_PRICE_STARTER` | 3 references | No | Used by `src/app/api/create-checkout-session/route.ts` and `src/app/api/webhooks/stripe/route.ts`. |
| `STRIPE_PRICE_PRO` | 3 references | No | Used by `src/app/api/create-checkout-session/route.ts` and `src/app/api/webhooks/stripe/route.ts`. |
| `STRIPE_PRICE_CLINIC` | 1 reference | No | Used by `src/app/api/create-checkout-session/route.ts` as `team` fallback. |

Conclusion: these are legacy/pre-AU variables, but they are not safe to delete until the old checkout and webhook code paths are removed or migrated.

Related issue: `src/app/pricing/pricing-client.tsx` posts Pro/Scale checkout to `/api/create-checkout-session`, which still uses legacy plan slugs and legacy env names. That route has no `scale` key, only `starter`, `pro`, and `team`, so the Scale CTA is likely broken and Pro likely uses `STRIPE_PRICE_PRO` rather than `STRIPE_PRICE_COACH_PRO`.

## 3. Vercel Cron Audit

`web-dashboard/vercel.json` defines four crons:

| Cron path | Schedule | Route exists? | Handler method | `CRON_SECRET` gated? | Notes |
|---|---|---:|---|---|---|
| `/api/emails/weekly-summary` | `0 8 * * 0` | Yes | `POST` only | Yes | Vercel Cron sends `GET` requests. This route exports only `POST`, so the cron likely will not execute successfully as configured. |
| `/api/messages/scheduled` | `0 9 * * *` | Yes | `GET` and `POST` | Yes | `verifyAuthToken()` requires `Authorization: Bearer ${CRON_SECRET}` and fails closed if `CRON_SECRET` is missing. |
| `/api/cron/email-sequences` | `0 10 * * *` | Yes | `GET` | Weak/conditional | It checks `if (cronSecret && authHeader !== Bearer token)`, so if `CRON_SECRET` is unset the route runs unauthenticated. |
| `/api/cron/ai-coach-expiry` | `0 12 * * *` | Yes | `GET` | Yes | Requires `Authorization: Bearer ${CRON_SECRET}`. Also requires `AI_WEBHOOK_SECRET` and `NEXT_PUBLIC_SITE_URL`/site URL for internal summarise call. |

## 4. Marketing Pages Last-Pass List

Quick scan only. No browser run or code edits.

| Page / area | State notes |
|---|---|
| `/` (`src/app/page.tsx`) | Visually fleshed out, but has footer links pointing to `#` for Platform/Pricing/Features/Privacy/Terms. Copy says "No credit card required", while `/pricing` says coach plans require a card. Main CTAs go to `/register`, which appears to use stale hard-coded prices. Heavy emoji/icon style may not match the later, more restrained brand direction. |
| `/pricing` (`src/app/pricing/page.tsx`, `pricing-client.tsx`) | Pricing values are derived from canonical `src/lib/pricing.ts`, good. But Pro/Scale checkout buttons post to legacy `/api/create-checkout-session`; Scale is likely broken because that API has `team`, not `scale`, and Pro uses legacy env fallbacks. CTA at bottom links back to `/pricing` instead of a specific setup/register flow. |
| `/trial/setup` | Polished multi-step trial signup, but it creates a Supabase profile directly and does not start Stripe checkout. Copy says 14-day trial/cancel anytime; this may intentionally be no-card trial, but it conflicts with `/pricing` FAQ saying Stripe card is required. It writes `subscription_tier` as URL slug (`starter`, `pro`, `scale`) rather than canonical coach tier IDs. |
| `/trial/expired` | Stale. Hard-coded old prices (`$29 AUD`, `$79 AUD`, Starter free) and "Choose" buttons are not wired to checkout. Needs refresh or removal before launch. |
| `/register` (`src/app/(auth)/register/page.tsx`) | Active root/compare CTAs point here. It calls the newer `/api/stripe/checkout`, but the page has stale hard-coded Coach prices (`49.99`, `99.99`, `199.99`) and AI weekly prices. It also says "No credit card required" while immediately redirecting to Stripe checkout. |
| `/compare` | Basic comparison index exists. CTAs point to `/register`, so inherit `/register` pricing/copy risk. Uses `logo.svg` while other pages use `logo.png`; both assets exist. |
| `/compare/[competitor]` | Functional dynamic comparison page for Trainerize/TrueCoach. Contains named testimonial-style quotes; if these are not real/signed, they are launch/legal risk. CTAs point to `/register`. |
| `/blog` | Looks fleshed out and links pricing via `/#pricing`; quick scan did not find broken placeholders beyond normal marketing CTA copy. |
| `/help` and `/help/contact` | Help content exists. `/help` says credit card is required for trial, consistent with `/pricing` but inconsistent with `/` and `/register`. |
| `/privacy-policy`, `/terms`, `/refund-policy` | Routes exist. Refund policy says 7-day free trial, conflicting with 14-day coach trial copy elsewhere. |

## 5. Recommended Follow-Up Order

1. Decide the canonical coach web signup path: `/register`, `/trial/setup`, or `/pricing` + checkout.
2. Migrate `/pricing` Pro/Scale CTAs away from legacy `/api/create-checkout-session` or update that route to AU canonical plan IDs.
3. Migrate or delete `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_CLINIC`, and related legacy route references after step 2.
4. Fix `/api/emails/weekly-summary` to expose a `GET` handler for Vercel Cron, or change cron execution strategy.
5. Make `/api/cron/email-sequences` fail closed when `CRON_SECRET` is missing.
6. Normalize marketing trial/card copy across `/`, `/pricing`, `/register`, `/trial/setup`, `/help`, and `/refund-policy`.
7. Refresh or remove stale `/trial/expired`.

## Fixes 2026-04-26

| Commit | Files changed | Summary |
|---|---|---|
| `8030de9` | `src/app/api/create-checkout-session/route.ts` | Remapped the legacy pricing checkout route to canonical AU coach env vars and added `scale` monthly/annual support via `STRIPE_PRICE_COACH_SCALE` and `STRIPE_PRICE_COACH_SCALE_ANNUAL`. |
| `3b97119` | `src/app/api/emails/weekly-summary/route.ts` | Added a `GET` handler for the Vercel weekly summary cron while preserving `POST`, and made missing `CRON_SECRET` return a clear 500. |
| `524c06b` | `src/app/api/cron/email-sequences/route.ts`, `src/app/api/cron/ai-coach-expiry/route.ts` | Made every route under `/api/cron/` fail closed when `CRON_SECRET` is missing instead of allowing unauthenticated or `Bearer undefined` execution. |

Verification:
- `npm run build` passed before each commit.
- No `lint` npm script exists in `web-dashboard/package.json`, so there was no separate lint command to run.
- Vercel docs confirm Cron Jobs trigger the configured path with an HTTP `GET` request: https://vercel.com/docs/cron-jobs.
