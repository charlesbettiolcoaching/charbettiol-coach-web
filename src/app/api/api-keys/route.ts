export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { resolveTierFeatures } from '@/lib/tier-features'
import { generateApiKey } from '@/lib/api-keys'

/**
 * API key management for Scale-tier coaches.
 *
 * GET  → list the caller's active keys (hash never returned; prefix only).
 * POST → mint a new key. Body: { name: string }. Returns plaintext ONCE.
 *
 * Scale-only. Lower tiers get 402.
 */

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createAdmin(url, key)
}

async function tierCheck(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .maybeSingle()
  const tf = resolveTierFeatures((profile as any)?.subscription_tier ?? null)
  return { allowed: tf.canAccessAPIAccess, tier: (profile as any)?.subscription_tier ?? null }
}

export async function GET() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { allowed, tier } = await tierCheck(supabase, user.id)
  if (!allowed) {
    return NextResponse.json(
      { error: 'TIER_LOCKED', message: 'API access requires the Scale plan.', tier },
      { status: 402 },
    )
  }

  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, last_used_at, revoked_at, created_at, expires_at')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ keys: keys ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { allowed, tier } = await tierCheck(supabase, user.id)
  if (!allowed) {
    return NextResponse.json(
      { error: 'TIER_LOCKED', message: 'API access requires the Scale plan.', tier },
      { status: 402 },
    )
  }

  const { name } = (await req.json().catch(() => ({}))) as { name?: string }
  if (!name || typeof name !== 'string' || name.length > 100) {
    return NextResponse.json({ error: 'name required (max 100 chars)' }, { status: 400 })
  }

  const admin = adminClient()
  const { plain, prefix, hash } = generateApiKey()

  const { data: created, error: insertErr } = await admin
    .from('api_keys')
    .insert({
      coach_id: user.id,
      name,
      key_prefix: prefix,
      key_hash: hash,
    })
    .select('id, name, key_prefix, created_at')
    .single()

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  // Return plaintext ONCE. Client must save it — we can never show it again.
  return NextResponse.json({ key: created, plaintext: plain })
}
