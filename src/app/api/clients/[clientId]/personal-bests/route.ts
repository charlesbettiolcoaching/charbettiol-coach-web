import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Ctx = { params: { clientId: string } }

/**
 * GET /api/clients/:clientId/personal-bests
 *
 * Returns all personal bests for the client, grouped by exercise.
 * Each exercise has one PB per rep count (e.g. 1RM, 3RM, 5RM).
 *
 * Accessible by the client themselves or their coach.
 *
 * Query params:
 *   exerciseId  — filter to a single exercise
 *   reps        — filter to a specific rep count (e.g. 1 for 1RM)
 *
 * Response: {
 *   personal_bests: PersonalBest[],    // flat list sorted by exercise name + reps
 *   by_exercise: Record<string, PersonalBest[]>  // keyed by exercise.id
 * }
 */
export async function GET(req: NextRequest, { params }: Ctx) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { clientId } = params

  // Verify access
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

  const { searchParams } = new URL(req.url)
  const exerciseId = searchParams.get('exerciseId')
  const repsFilter = searchParams.get('reps')

  let query = supabase
    .from('personal_bests')
    .select(`
      *,
      exercise:exercises(id, name, category, muscle_groups)
    `)
    .eq('client_id', clientId)
    .order('achieved_at', { ascending: false })

  if (exerciseId) query = query.eq('exercise_id', exerciseId)
  if (repsFilter) query = query.eq('reps', parseInt(repsFilter))

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Group by exercise for convenience
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byExercise: Record<string, any[]> = {}
  for (const pb of data ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exId = (pb as any).exercise_id
    if (!byExercise[exId]) byExercise[exId] = []
    byExercise[exId].push(pb)
  }

  // Sort each group by reps ascending (1RM first)
  for (const exId in byExercise) {
    byExercise[exId].sort((a, b) => a.reps - b.reps)
  }

  return NextResponse.json({
    personal_bests: data,
    by_exercise:    byExercise,
  })
}
