import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Ctx = { params: { clientId: string } }

/**
 * GET /api/clients/:clientId/programs/active
 *
 * Returns the currently active program for the client with full
 * workout and exercise structure — ready for the mobile app to render.
 *
 * Accessible by:
 *   - The client themselves
 *   - The coach assigned to that client
 *
 * Response: { program: ActiveProgram | null }
 *
 * where ActiveProgram includes:
 *   - Program metadata + targets
 *   - workouts[] sorted by week + day, each with:
 *       - exercises[] sorted by order_index
 *       - supersets[]
 *       - exercise details (name, category, muscle_groups, instructions, demo_video_url)
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { clientId } = params

  // Verify access: client themselves or their coach
  if (user.id !== clientId) {
    const { data: clientProfile } = await supabase
      .from('profiles')
      .select('coach_id')
      .eq('id', clientId)
      .single()

    if (!clientProfile || clientProfile.coach_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { data, error } = await supabase
    .from('programs')
    .select(`
      id, name, description, duration_weeks, days_per_week,
      goal, difficulty, status, started_at, notes,
      workouts:program_workouts(
        id, week_number, day_number, name, notes,
        supersets(id, label),
        exercises:program_workout_exercises(
          id, order_index, sets, reps_min, reps_max,
          weight, weight_unit, rest_seconds, rpe, tempo, notes,
          superset_id,
          exercise:exercises(
            id, name, category, muscle_groups, equipment,
            movement_type, instructions, demo_video_url, demo_image_url
          )
        )
      )
    `)
    .eq('client_id', clientId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!data) return NextResponse.json({ program: null })

  // Sort workouts and exercises
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program = data as any
  program.workouts?.sort(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: any, b: any) =>
      a.week_number !== b.week_number
        ? a.week_number - b.week_number
        : a.day_number - b.day_number
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program.workouts?.forEach((w: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    w.exercises?.sort((a: any, b: any) => a.order_index - b.order_index)
    // Attach rep_range string for convenience
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    w.exercises?.forEach((e: any) => {
      e.rep_range =
        e.reps_min === e.reps_max
          ? String(e.reps_min)
          : `${e.reps_min}–${e.reps_max}`
    })
  })

  return NextResponse.json({ program })
}
