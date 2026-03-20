import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Ctx = { params: { logId: string } }

/**
 * GET /api/workout-logs/:logId
 * Returns a single log with all sets and exercise details.
 * Accessible by the client who owns it or their coach.
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('workout_logs')
    .select(`
      *,
      workout:program_workouts(id, name, week_number, day_number),
      program:programs(id, name),
      sets:workout_log_sets(
        *,
        exercise:exercises(id, name, category, muscle_groups)
      )
    `)
    .eq('id', params.logId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const log = data as any
  const isOwner = log.client_id === user.id

  // Coach check
  let isCoach = false
  if (!isOwner) {
    const { data: cp } = await supabase
      .from('profiles')
      .select('coach_id')
      .eq('id', log.client_id)
      .single()
    isCoach = cp?.coach_id === user.id
  }

  if (!isOwner && !isCoach) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ log: data })
}
