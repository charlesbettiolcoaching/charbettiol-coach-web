import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Ctx = { params: { programId: string; clientId: string } }

/**
 * POST /api/programs/:programId/assign/:clientId
 *
 * Coach assigns a program to a client and sets it active.
 * - Validates the coach owns the program
 * - Validates the client belongs to this coach
 * - Sets client_id, status = 'active', started_at = now()
 *
 * Any previously active program for this client is set to 'draft'
 * so there is always at most one active program per client.
 */
export async function POST(_req: NextRequest, { params }: Ctx) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Confirm the caller is a coach who owns this program
  const { data: program } = await supabase
    .from('programs')
    .select('coach_id, status')
    .eq('id', params.programId)
    .single()

  if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404 })
  if (program.coach_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Confirm the client belongs to this coach
  const { data: clientProfile } = await supabase
    .from('profiles')
    .select('id, coach_id')
    .eq('id', params.clientId)
    .single()

  if (!clientProfile || clientProfile.coach_id !== user.id) {
    return NextResponse.json({ error: 'Client not found or not your client' }, { status: 404 })
  }

  // Deactivate any currently active programs for this client
  await supabase
    .from('programs')
    .update({ status: 'draft' })
    .eq('client_id', params.clientId)
    .eq('status', 'active')
    .neq('id', params.programId)

  // Assign and activate
  const { data, error } = await supabase
    .from('programs')
    .update({
      client_id:  params.clientId,
      status:     'active',
      started_at: new Date().toISOString(),
    })
    .eq('id', params.programId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ program: data })
}
