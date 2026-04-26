import Stripe from 'stripe'

// Lightweight Stripe REST API helper — used by dashboard summary routes.
const STRIPE_BASE = 'https://api.stripe.com/v1'

let stripeClient: Stripe | null = null

export function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY')
  if (!stripeClient) stripeClient = new Stripe(key)
  return stripeClient
}

function stripeHeaders() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('no_key')
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }
}

export async function stripeGet(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${STRIPE_BASE}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), { headers: stripeHeaders() })
  return res.json()
}

export async function stripePost(path: string, body: Record<string, string>) {
  const res = await fetch(`${STRIPE_BASE}${path}`, {
    method: 'POST',
    headers: stripeHeaders(),
    body: new URLSearchParams(body).toString(),
  })
  return res.json()
}

export async function createBillingPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}) {
  return getStripeClient().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}
