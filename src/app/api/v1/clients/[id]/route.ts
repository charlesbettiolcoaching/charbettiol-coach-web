export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest } from '@/lib/api-auth'

/**
 * GET /api/v1/clients/:id
 *
 * Fetch one client by id. Must belong to the authenticated coach.
 * Returns 404 if the id isn't found OR isn't owned by the caller
 * (we don't distinguish the two, to avoid leaking existence of clients
 * owned by other coaches).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await authenticateApiRequest(req)
  if ('error' in auth) return auth.error

  const { data: row, error } = await auth.admin
    .from('profiles')
    .select('id, name, full_name, email, created_at, primary_program_id, goal, current_weight_kg, target_weight_kg')
    .eq('id', params.id)
    .eq('role', 'client')
    .eq('coach_id', auth.coachId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!row) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  return NextResponse.json({
    client: {
      id: row.id,
      name: (row as any).name ?? (row as any).full_name,
      email: (row as any).email,
      created_at: (row as any).created_at,
      active_program_id: (row as any).primary_program_id ?? null,
      goal: (row as any).goal ?? null,
      current_weight_kg: (row as any).current_weight_kg ?? null,
      target_weight_kg: (row as any).target_weight_kg ?? null,
    },
  })
}
