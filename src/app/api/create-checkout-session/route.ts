export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

// Lazy initialization — only evaluated at request time, not during build
function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY')
  return new Stripe(key)
}

type PriceConfig = {
  prices: Record<string, Record<string, string>>
  trialDays: Record<string, number>
}

// Price IDs keyed by public pricing slug → billing period.
// Keep these on the canonical AU env vars; the pre-AU
// STRIPE_PRICE_{STARTER,PRO,CLINIC} vars are legacy only.
function getPriceConfig(): PriceConfig {
  return {
    prices: {
      starter: {
        monthly: process.env.STRIPE_PRICE_COACH_STARTER ?? '',
        annual:  process.env.STRIPE_PRICE_COACH_STARTER_ANNUAL ?? '',
      },
      pro: {
        monthly: process.env.STRIPE_PRICE_COACH_PRO ?? '',
        annual:  process.env.STRIPE_PRICE_COACH_PRO_ANNUAL ?? '',
      },
      scale: {
        monthly: process.env.STRIPE_PRICE_COACH_SCALE ?? '',
        annual:  process.env.STRIPE_PRICE_COACH_SCALE_ANNUAL ?? '',
      },
      ai_starter: {
        monthly: process.env.STRIPE_PRICE_AI_STARTER ?? '',
        annual:  process.env.STRIPE_PRICE_AI_STARTER_ANNUAL ?? '',
      },
      ai_pro: {
        monthly: process.env.STRIPE_PRICE_AI_PRO ?? '',
        annual:  process.env.STRIPE_PRICE_AI_PRO_ANNUAL ?? '',
      },
      ai_elite: {
        monthly: process.env.STRIPE_PRICE_AI_ELITE ?? '',
        annual:  process.env.STRIPE_PRICE_AI_ELITE_ANNUAL ?? '',
      },
    },
    trialDays: {
      starter: 14,
      pro: 14,
      scale: 14,
      ai_starter: 7,
      ai_pro: 7,
      ai_elite: 7,
    },
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan, billing = 'monthly' } = await req.json()
    const coachId = user.id

    const priceConfig = getPriceConfig()
    const planSlug = typeof plan === 'string' ? plan.toLowerCase() : ''
    const billingPeriod = billing === 'annual' ? 'annual' : 'monthly'
    const priceId = priceConfig.prices[planSlug]?.[billingPeriod]
    if (!priceId) {
      return NextResponse.json({ error: `No price configured for plan=${planSlug || plan} billing=${billingPeriod}` }, { status: 400 })
    }
    const trialDays = priceConfig.trialDays[planSlug] ?? 14

    const stripe = getStripeClient()
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: trialDays,
        metadata: { coachId, plan: planSlug, billing: billingPeriod },
      },
      success_url: `${siteUrl}/dashboard?subscription=success`,
      cancel_url:  `${siteUrl}/pricing?cancelled=true`,
      metadata: { coachId, plan: planSlug, billing: billingPeriod },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
