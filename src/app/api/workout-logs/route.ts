import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const LB_TO_KG = 0.453592

/** Epley formula: estimated 1-rep max from weight × reps */
function epley1RM(weightKg: number, reps: number): number {
  if (reps === 1) return weightKg
  return parseFloat((weightKg * (1 + reps / 30)).toFixed(2))
}

type SetInput = {
  exercise_id: string
  set_number: number
  reps_completed?: number | null
  weight_input?: number | null
  weight_unit?: 'kg' | 'lb'
  rpe_actual?: number | null
  notes?: string | null
  is_warmup?: boolean
}

/**
 * POST /api/workout-logs
 *
 * Client submits a completed workout session.
 * Automatically evaluates personal bests per exercise × rep count
 * and upserts into personal_bests where e1RM improves.
 *
 * Body: {
 *   workout_id?,          // program_workouts.id if from a program
 *   program_id?,          // programs.id
 *   logged_at?,           // ISO string, defaults to now
 *   duration_minutes?,
 *   notes?,
 *   sets: SetInput[]
 * }
 *
 * Response: {
 *   log: WorkoutLog,
 *   new_personal_bests: PersonalBest[]   // PBs set this session
 * }
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    workout_id,
    program_id,
    logged_at,
    duration_minutes,
    notes,
    sets,
  }: {
    workout_id?: string
    program_id?: string
    logged_at?: string
    duration_minutes?: number
    notes?: string
    sets: SetInput[]
  } = body

  if (!Array.isArray(sets) || sets.length === 0) {
    return NextResponse.json({ error: 'sets array is required and must not be empty' }, { status: 400 })
  }

  // ── 1. Insert the log header ──────────────────────────────────
  const { data: log, error: logError } = await supabase
    .from('workout_logs')
    .insert({
      client_id:        user.id,
      program_id:       program_id       ?? null,
      workout_id:       workout_id       ?? null,
      logged_at:        logged_at        ?? new Date().toISOString(),
      duration_minutes: duration_minutes ?? null,
      notes:            notes            ?? null,
    })
    .select()
    .single()

  if (logError) return NextResponse.json({ error: logError.message }, { status: 500 })

  // ── 2. Insert individual sets ─────────────────────────────────
  const setRows = sets.map((s) => {
    const unit    = s.weight_unit ?? 'kg'
    const input   = s.weight_input ?? null
    const weightKg = input == null
      ? null
      : unit === 'lb'
        ? parseFloat((input * LB_TO_KG).toFixed(2))
        : input

    return {
      log_id:         log.id,
      exercise_id:    s.exercise_id,
      set_number:     s.set_number,
      reps_completed: s.reps_completed ?? null,
      weight_kg:      weightKg,
      weight_input:   input,
      weight_unit:    unit,
      rpe_actual:     s.rpe_actual ?? null,
      notes:          s.notes      ?? null,
      is_warmup:      s.is_warmup  ?? false,
    }
  })

  const { data: insertedSets, error: setsError } = await supabase
    .from('workout_log_sets')
    .insert(setRows)
    .select()

  if (setsError) return NextResponse.json({ error: setsError.message }, { status: 500 })

  // ── 3. Evaluate personal bests ───────────────────────────────
  // Only count working (non-warmup) sets with valid weight and reps
  type WorkingSet = {
    id: string
    exercise_id: string
    reps_completed: number
    weight_kg: number
    e1rm: number
  }

  const workingSets: WorkingSet[] = (insertedSets ?? [])
    .filter((s) => !s.is_warmup && s.reps_completed != null && s.weight_kg != null)
    .map((s) => ({
      id:             s.id,
      exercise_id:    s.exercise_id,
      reps_completed: s.reps_completed as number,
      weight_kg:      s.weight_kg as number,
      e1rm:           epley1RM(s.weight_kg as number, s.reps_completed as number),
    }))

  // Group: per exercise × reps, keep the best e1RM set from this session
  const bestByExerciseReps = new Map<string, WorkingSet>()
  for (const s of workingSets) {
    const key     = `${s.exercise_id}::${s.reps_completed}`
    const current = bestByExerciseReps.get(key)
    if (!current || s.e1rm > current.e1rm) {
      bestByExerciseReps.set(key, s)
    }
  }

  const newPBs: Record<string, unknown>[] = []

  if (bestByExerciseReps.size > 0) {
    // Fetch existing PBs for these exercises
    const exerciseIds = Array.from(new Set(Array.from(bestByExerciseReps.values()).map((s) => s.exercise_id)))
    const { data: existingPBs } = await supabase
      .from('personal_bests')
      .select('exercise_id, reps, estimated_1rm_kg')
      .eq('client_id', user.id)
      .in('exercise_id', exerciseIds)

    const existingMap = new Map<string, number>()
    for (const pb of existingPBs ?? []) {
      existingMap.set(`${pb.exercise_id}::${pb.reps}`, pb.estimated_1rm_kg)
    }

    // Collect candidates that beat the existing PB
    const pbUpserts = []
    for (const [key, s] of Array.from(bestByExerciseReps)) {
      const existing1rm = existingMap.get(key) ?? 0
      if (s.e1rm > existing1rm) {
        pbUpserts.push({
          client_id:        user.id,
          exercise_id:      s.exercise_id,
          reps:             s.reps_completed,
          weight_kg:        s.weight_kg,
          estimated_1rm_kg: s.e1rm,
          achieved_at:      log.logged_at,
          log_set_id:       s.id,
        })
      }
    }

    if (pbUpserts.length > 0) {
      const { data: upserted } = await supabase
        .from('personal_bests')
        .upsert(pbUpserts, { onConflict: 'client_id,exercise_id,reps' })
        .select('*, exercise:exercises(id, name)')

      if (upserted) newPBs.push(...upserted)
    }
  }

  return NextResponse.json({
    log:                { ...log, sets: insertedSets },
    new_personal_bests: newPBs,
  }, { status: 201 })
}

/**
 * GET /api/workout-logs
 * Client fetches their own log history.
 * Coach fetches by passing ?clientId=
 * Query params: clientId (coach only), programId, limit, offset
 */
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const clientIdParam = searchParams.get('clientId')
  const programId     = searchParams.get('programId')
  const limit         = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
  const offset        = parseInt(searchParams.get('offset') ?? '0')

  let targetClientId = user.id

  // Coach querying a client's logs
  if (clientIdParam && clientIdParam !== user.id) {
    const { data: cp } = await supabase
      .from('profiles')
      .select('coach_id')
      .eq('id', clientIdParam)
      .single()

    if (!cp || cp.coach_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    targetClientId = clientIdParam
  }

  let query = supabase
    .from('workout_logs')
    .select(`
      *,
      workout:program_workouts(id, name, week_number, day_number),
      sets:workout_log_sets(*, exercise:exercises(id, name, category))
    `)
    .eq('client_id', targetClientId)
    .order('logged_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (programId) query = query.eq('program_id', programId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ logs: data })
}
