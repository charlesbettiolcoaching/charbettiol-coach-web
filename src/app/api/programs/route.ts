import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/programs
 * Coach-only. Returns all programs the coach owns.
 * Query params: clientId, status
 */
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'coach') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId')
  const status   = searchParams.get('status')

  let query = supabase
    .from('programs')
    .select(`
      *,
      client:profiles!programs_client_id_fkey(id, name, email, avatar_url)
    `)
    .eq('coach_id', user.id)
    .order('updated_at', { ascending: false })

  if (clientId) query = query.eq('client_id', clientId)
  if (status)   query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ programs: data })
}

/**
 * POST /api/programs
 * Coach-only. Creates a new program (draft by default).
 *
 * Body: { name, description?, duration_weeks?, days_per_week?,
 *         goal?, difficulty?, client_id?, notes?, template_id? }
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'coach') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const {
    name, description, duration_weeks, days_per_week,
    goal, difficulty, client_id, notes, template_id,
  } = body

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('programs')
    .insert({
      coach_id:       user.id,
      client_id:      client_id      ?? null,
      template_id:    template_id    ?? null,
      name,
      description:    description    ?? null,
      duration_weeks: duration_weeks ?? 4,
      days_per_week:  days_per_week  ?? 3,
      goal:           goal           ?? 'general_fitness',
      difficulty:     difficulty     ?? 'intermediate',
      status:         'draft',
      notes:          notes          ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ program: data }, { status: 201 })
}
