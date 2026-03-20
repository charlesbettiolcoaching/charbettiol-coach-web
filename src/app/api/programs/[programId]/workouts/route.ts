import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Ctx = { params: { programId: string } }

/**
 * GET /api/programs/:programId/workouts
 * Returns all workouts for a program, sorted by week then day.
 * Includes nested exercises (with exercise details) and supersets.
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify the caller can access this program
  const { data: program } = await supabase
    .from('programs')
    .select('coach_id, client_id, status')
    .eq('id', params.programId)
    .single()

  if (!program) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isCoach  = program.coach_id === user.id
  const isClient = program.client_id === user.id && ['active', 'completed'].includes(program.status)
  if (!isCoach && !isClient) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('program_workouts')
    .select(`
      *,
      supersets(*),
      exercises:program_workout_exercises(
        *,
        exercise:exercises(*)
      )
    `)
    .eq('program_id', params.programId)
    .order('week_number')
    .order('day_number')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sort exercises within each workout by order_index
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?.forEach((w: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    w.exercises?.sort((a: any, b: any) => a.order_index - b.order_index)
  })

  return NextResponse.json({ workouts: data })
}

/**
 * POST /api/programs/:programId/workouts
 * Coach-only. Adds a workout session to the program.
 *
 * Body: { week_number, day_number, name, notes? }
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: program } = await supabase
    .from('programs')
    .select('coach_id')
    .eq('id', params.programId)
    .single()

  if (!program) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (program.coach_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { week_number, day_number, name, notes } = body

  if (!name || day_number == null) {
    return NextResponse.json({ error: 'name and day_number are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('program_workouts')
    .insert({
      program_id:  params.programId,
      week_number: week_number ?? 1,
      day_number,
      name,
      notes: notes ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ workout: data }, { status: 201 })
}
