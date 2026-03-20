import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Ctx = { params: { workoutId: string } }

/** Resolve whether the caller (coach or client) can access this workout */
async function resolveAccess(
  supabase: ReturnType<typeof createClient>,
  workoutId: string,
  userId: string
): Promise<{ allowed: boolean; isCoach: boolean; workout: Record<string, unknown> | null }> {
  const { data: workout } = await supabase
    .from('program_workouts')
    .select('*, program:programs(coach_id, client_id, status)')
    .eq('id', workoutId)
    .single()

  if (!workout) return { allowed: false, isCoach: false, workout: null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = (workout as any).program
  const isCoach  = p?.coach_id === userId
  const isClient = p?.client_id === userId && ['active', 'completed'].includes(p?.status)

  return { allowed: isCoach || isClient, isCoach, workout: workout as Record<string, unknown> }
}

/** GET /api/workouts/:workoutId — single workout with exercises */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { allowed } = await resolveAccess(supabase, params.workoutId, user.id)
  if (!allowed) return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 })

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
    .eq('id', params.workoutId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sort exercises by order_index
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((data as any).exercises) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data as any).exercises.sort((a: any, b: any) => a.order_index - b.order_index)
  }

  return NextResponse.json({ workout: data })
}

/** PATCH /api/workouts/:workoutId — coach-only: update name, notes, week/day */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { allowed, isCoach } = await resolveAccess(supabase, params.workoutId, user.id)
  if (!allowed) return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 })
  if (!isCoach)  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const ALLOWED = ['name', 'notes', 'week_number', 'day_number']
  const patch = Object.fromEntries(
    Object.entries(body).filter(([k]) => ALLOWED.includes(k))
  )

  const { data, error } = await supabase
    .from('program_workouts')
    .update(patch)
    .eq('id', params.workoutId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ workout: data })
}

/** DELETE /api/workouts/:workoutId — coach-only */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { allowed, isCoach } = await resolveAccess(supabase, params.workoutId, user.id)
  if (!allowed) return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 })
  if (!isCoach)  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase
    .from('program_workouts')
    .delete()
    .eq('id', params.workoutId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
