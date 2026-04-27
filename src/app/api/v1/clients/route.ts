export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest } from '@/lib/api-auth'

/**
 * GET /api/v1/clients
 *
 * Public API v1 — list clients owned by the authenticated coach.
 *
 * Auth: Authorization: Bearer prk_live_…  (Scale tier only; key generation
 * is gated to Scale and validateApiKey() will reject revoked/expired keys.)
 *
 * Query params:
 *   limit   — 1..100, default 25
 *   offset  — default 0
 *   search  — optional substring match on name/email
 *
 * Response:
 *   { clients: [{ id, name, email, created_at, active_program_id, last_checkin_at }, ...],
 *     total: N, limit, offset }
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req)
  if ('error' in auth) return auth.error

  const { searchParams } = new URL(req.url)
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '25', 10) || 25, 1), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10) || 0, 0)
  const search = (searchParams.get('search') ?? '').trim()

  let query = auth.admin
    .from('profiles')
    .select('id, name, full_name, email, created_at, primary_program_id', { count: 'exact' })
    .eq('role', 'client')
    .eq('coach_id', auth.coachId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    const escaped = search.replace(/[%_]/g, '\\$&')
    query = query.or(`name.ilike.%${escaped}%,full_name.ilike.%${escaped}%,email.ilike.%${escaped}%`)
  }

  const { data: rows, error, count } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const clients = (rows ?? []).map((r: any) => ({
    id: r.id,
    name: r.name ?? r.full_name,
    email: r.email,
    created_at: r.created_at,
    active_program_id: r.primary_program_id ?? null,
  }))

  return NextResponse.json({
    clients,
    total: count ?? clients.length,
    limit,
    offset,
  })
}
