/**
 * Helper for /api/v1/* routes that authenticate via API key.
 *
 * Usage inside a route handler:
 *
 *   const auth = await authenticateApiRequest(req)
 *   if ('error' in auth) return auth.error
 *   // auth.coachId is the owning coach's id; auth.admin is the service-role client.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin, SupabaseClient } from '@supabase/supabase-js'
import { validateApiKey } from './api-keys'

type AuthResult =
  | { coachId: string; keyId: string; admin: SupabaseClient }
  | { error: NextResponse }

export async function authenticateApiRequest(req: NextRequest): Promise<AuthResult> {
  const auth = req.headers.get('authorization') ?? req.headers.get('Authorization') ?? ''
  const match = auth.match(/^Bearer\s+(prk_live_[A-Za-z0-9]+)$/)
  if (!match) {
    return {
      error: NextResponse.json(
        { error: 'MISSING_API_KEY', message: 'Send Authorization: Bearer prk_live_…' },
        { status: 401 },
      ),
    }
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return { error: NextResponse.json({ error: 'SERVER_MISCONFIGURED' }, { status: 500 }) }
  }
  const admin = createAdmin(url, key)
  const result = await validateApiKey(match[1], admin)
  if (!result.ok || !result.coachId || !result.keyId) {
    return {
      error: NextResponse.json(
        { error: 'INVALID_API_KEY', reason: result.reason },
        { status: 401 },
      ),
    }
  }
  return { coachId: result.coachId, keyId: result.keyId, admin }
}
