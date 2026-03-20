import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Ctx = { params: { workoutId: string; exerciseId: string } }

async function assertCoach(
  supabase: ReturnType<typeof createClient>,
  workoutId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('program_workouts')
    .select('program:programs(coach_id)')
    .eq('id', workoutId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any)?.program?.coach_id === userId
}

/**
 * PATCH /api/workouts/:workoutId/exercises/:exerciseId
 * Coach-only. Update sets, reps, weight, rest, RPE, tempo, notes,
 * order_index, or superset_id for a specific exercise in this workout.
 *
 * :exerciseId here is the program_workout_exercises.id (the join row),
 * NOT the exercises.id.
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isCoach = await assertCoach(supabase, params.workoutId, user.id)
  if (!isCoach) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const ALLOWED = [
    'order_index', 'sets', 'reps_min', 'reps_max',
    'weight', 'weight_unit', 'rest_seconds',
    'rpe', 'tempo', 'notes', 'superset_id',
  ]
  const patch = Object.fromEntries(
    Object.entries(body).filter(([k]) => ALLOWED.includes(k))
  )

  const { data, error } = await supabase
    .from('program_workout_exercises')
    .update(patch)
    .eq('id', params.exerciseId)
    .eq('workout_id', params.workoutId)
    .select('*, exercise:exercises(*)')
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ exercise: data })
}

/**
 * DELETE /api/workouts/:workoutId/exercises/:exerciseId
 * Coach-only. Removes the exercise from the workout.
 */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isCoach = await assertCoach(supabase, params.workoutId, user.id)
  if (!isCoach) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase
    .from('program_workout_exercises')
    .delete()
    .eq('id', params.exerciseId)
    .eq('workout_id', params.workoutId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
