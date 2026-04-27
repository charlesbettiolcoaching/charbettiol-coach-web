export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveTierFeatures } from '@/lib/tier-features'

/**
 * Pro+ coach referral code management.
 *
 * GET  → returns the coach's current code, generating one if none exists.
 * POST → regenerates the code (invalidates the old one).
 *
 * Tier-gated: coach_pro or coach_scale only. Free/Starter → 402.
 *
 * Code format: PROPEL-<6 uppercase alphanumeric>. We skip 0/O/1/I/L to
 * keep it unambiguous when clients type it in.
 */

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
const CODE_LEN = 6

function generateCode(): string {
  let out = 'PROPEL-'
  for (let i = 0; i < CODE_LEN; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return out
}

async function generateUniqueCode(supabase: any): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = generateCode()
    const { data: existing } = await supabase
      .from('coach_referral_codes')
      .select('id')
      .eq('code', candidate)
      .maybeSingle()
    if (!existing) return candidate
  }
  throw new Error('Could not generate a unique referral code after 8 attempts')
}

async function assertProOrScale(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .maybeSingle()
  const tf = resolveTierFeatures((profile as any)?.subscription_tier ?? null)
  return {
    allowed: tf.canAccessB2CDiscountCoupon,
    tier: (profile as any)?.subscription_tier ?? null,
  }
}

export async function GET(_req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { allowed, tier } = await assertProOrScale(supabase, user.id)
  if (!allowed) {
    return NextResponse.json(
      { error: 'TIER_LOCKED', message: 'Referral codes are a Pro feature.', tier },
      { status: 402 },
    )
  }

  // Fetch or create
  const { data: existing } = await supabase
    .from('coach_referral_codes')
    .select('*')
    .eq('coach_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ code: existing })
  }

  const newCode = await generateUniqueCode(supabase)
  const { data: created, error: insertErr } = await supabase
    .from('coach_referral_codes')
    .insert({
      coach_id: user.id,
      code: newCode,
      stripe_coupon_id: process.env.STRIPE_COUPON_COACH_B2C_30OFF ?? null,
      is_active: true,
    })
    .select()
    .single()

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }
  return NextResponse.json({ code: created })
}

export async function POST(_req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { allowed, tier } = await assertProOrScale(supabase, user.id)
  if (!allowed) {
    return NextResponse.json(
      { error: 'TIER_LOCKED', message: 'Referral codes are a Pro feature.', tier },
      { status: 402 },
    )
  }

  const newCode = await generateUniqueCode(supabase)
  const { data, error: upsertErr } = await supabase
    .from('coach_referral_codes')
    .upsert(
      {
        coach_id: user.id,
        code: newCode,
        stripe_coupon_id: process.env.STRIPE_COUPON_COACH_B2C_30OFF ?? null,
        is_active: true,
      },
      { onConflict: 'coach_id' },
    )
    .select()
    .single()

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 })
  }
  return NextResponse.json({ code: data, rotated: true })
}
