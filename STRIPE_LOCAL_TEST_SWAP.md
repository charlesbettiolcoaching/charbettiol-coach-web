# Stripe Local Test-Mode Swap Guide

Last updated: 2026-04-26

Use this when `web-dashboard/.env.local` contains live Stripe keys and price IDs, but you want local development to run against Stripe test mode. Do not paste live values into docs, commits, tickets, chat, or screenshots.

## Values To Replace In `.env.local`

Replace these local values with test-mode equivalents:

```dotenv
STRIPE_SECRET_KEY=<TEST_VALUE_HERE>
STRIPE_WEBHOOK_SECRET=<TEST_VALUE_HERE>

STRIPE_PRICE_AI_STARTER=<TEST_VALUE_HERE>
STRIPE_PRICE_AI_STARTER_ANNUAL=<TEST_VALUE_HERE>
STRIPE_PRICE_AI_PRO=<TEST_VALUE_HERE>
STRIPE_PRICE_AI_PRO_ANNUAL=<TEST_VALUE_HERE>
STRIPE_PRICE_AI_ELITE=<TEST_VALUE_HERE>
STRIPE_PRICE_AI_ELITE_ANNUAL=<TEST_VALUE_HERE>

STRIPE_PRICE_COACH_STARTER=<TEST_VALUE_HERE>
STRIPE_PRICE_COACH_STARTER_ANNUAL=<TEST_VALUE_HERE>
STRIPE_PRICE_COACH_PRO=<TEST_VALUE_HERE>
STRIPE_PRICE_COACH_PRO_ANNUAL=<TEST_VALUE_HERE>
STRIPE_PRICE_COACH_SCALE=<TEST_VALUE_HERE>
STRIPE_PRICE_COACH_SCALE_ANNUAL=<TEST_VALUE_HERE>
```

## Where To Get Each Value

### `STRIPE_SECRET_KEY`

Open Stripe Dashboard -> Developers -> API keys. Toggle **Test mode** on. Copy the **Secret key** value beginning with `sk_test_` and paste it into `STRIPE_SECRET_KEY`.

### `STRIPE_WEBHOOK_SECRET`

Open Stripe Dashboard -> Developers -> Webhooks. Toggle **Test mode** on. Open the test webhook endpoint used for local development, reveal the signing secret, and copy the value beginning with `whsec_` into `STRIPE_WEBHOOK_SECRET`.

If you use Stripe CLI for local webhook forwarding, copy the `whsec_...` value printed by `stripe listen --forward-to localhost:3000/api/webhooks/stripe` instead. Do not run that command from this guide unless you are intentionally starting a local Stripe listener.

### Coach Price IDs

Open Stripe Dashboard -> Product catalog -> Products. Toggle **Test mode** on. Open each test product and copy the exact test **Price ID** beginning with `price_`.

Paste the monthly prices into:

```dotenv
STRIPE_PRICE_COACH_STARTER=<TEST_VALUE_HERE>
STRIPE_PRICE_COACH_PRO=<TEST_VALUE_HERE>
STRIPE_PRICE_COACH_SCALE=<TEST_VALUE_HERE>
```

Paste the annual prices into:

```dotenv
STRIPE_PRICE_COACH_STARTER_ANNUAL=<TEST_VALUE_HERE>
STRIPE_PRICE_COACH_PRO_ANNUAL=<TEST_VALUE_HERE>
STRIPE_PRICE_COACH_SCALE_ANNUAL=<TEST_VALUE_HERE>
```

### AI Price IDs

Open Stripe Dashboard -> Product catalog -> Products. Toggle **Test mode** on. Open each AI product and copy the exact test **Price ID** beginning with `price_`.

Paste the monthly prices into:

```dotenv
STRIPE_PRICE_AI_STARTER=<TEST_VALUE_HERE>
STRIPE_PRICE_AI_PRO=<TEST_VALUE_HERE>
STRIPE_PRICE_AI_ELITE=<TEST_VALUE_HERE>
```

Paste the annual prices into:

```dotenv
STRIPE_PRICE_AI_STARTER_ANNUAL=<TEST_VALUE_HERE>
STRIPE_PRICE_AI_PRO_ANNUAL=<TEST_VALUE_HERE>
STRIPE_PRICE_AI_ELITE_ANNUAL=<TEST_VALUE_HERE>
```

## Local Verification

1. Start the dashboard locally:

```bash
cd web-dashboard
npm run dev
```

2. Sign in locally as a coach so the browser has a valid Supabase session cookie.

3. Copy the local request cookie from the browser dev tools and run:

```bash
curl -sS http://localhost:3000/api/create-checkout-session \
  -H 'Content-Type: application/json' \
  -H 'Cookie: <SUPABASE_AUTH_COOKIE_FROM_BROWSER>' \
  --data '{"plan":"starter","billing":"monthly"}'
```

Expected result: the JSON response contains a `sessionId` beginning with `cs_test_` and a Stripe Checkout URL for test mode. A `cs_live_` session ID means a live secret key is still being used locally.
