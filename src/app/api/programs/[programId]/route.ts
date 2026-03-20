import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Ctx = { params: { programId: string } }

/**
 * GET /api/programs/:programId
 * Returns the full program with nested workouts, exercises, and supersets.
 * Accessible by the owning coach or the assigned client (if active/completed).
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('programs')
    .select(`
      *,
      client:profiles!programs_client_id_fkey(id, name, email, avatar_url),
      workouts:program_workouts(
        *,
        supersets(*),
        exercises:program_workout_exercises(
          *,
          exercise:exercises(*)
        )
      )
    `)
    .eq('id', params.programId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (data.coach_id !== user.id && data.client_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Sort workouts by week then day
  if (data.workouts) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.workouts.sort((a: any, b: any) =>
      a.week_number !== b.week_number
        ? a.week_number - b.week_number
        : a.day_number - b.day_number
    )
    // Sort exercises within each workout by order_index
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.workouts.forEach((w: any) => {
      if (w.exercises) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        w.exercises.sort((a: any, b: any) => a.order_index - b.order_index)
      }
    })
  }

  return NextResponse.json({ program: data })
}

/**
 * PATCH /api/programs/:programId
 * Coach-only. Partial update of program metadata.
 * To activate: set status = 'active', started_at = <timestamp>
 * To complete: set status = 'completed', completed_at = <timestamp>
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabase
    .from('programs')
    .select('coach_id')
    .eq('id', params.programId)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.coach_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const ALLOWED = [
    'name', 'description', 'duration_weeks', 'days_per_week',
    'goal', 'difficulty', 'status', 'client_id', 'notes',
    'started_at', 'completed_at',
  ]
  const patch = Object.fromEntries(
    Object.entries(body).filter(([k]) => ALLOWED.includes(k))
  )

  const { data, error } = await supabase
    .from('programs')
    .update(patch)
    .eq('id', params.programId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ program: data })
}

/** DELETE /api/programs/:programId — cascade deletes workouts and exercises */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabase
    .from('programs')
    .select('coach_id')
    .eq('id', params.programId)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.coach_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase
    .from('programs')
    .delete()
    .eq('id', params.programId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
