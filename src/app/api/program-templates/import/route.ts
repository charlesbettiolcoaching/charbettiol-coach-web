import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/program-templates/import
 *
 * Imports a template from a JSON payload (as produced by the export endpoint).
 * Body: the raw export JSON object.
 *
 * Strips any IDs, sets coach_id to the current user, is_public to false.
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

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Basic validation
  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  // Validate optional _export_meta.source
  const meta = body._export_meta as Record<string, unknown> | undefined
  if (meta && meta.source !== 'openclaw') {
    return NextResponse.json({ error: 'Unrecognised export format' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('program_templates')
    .insert({
      coach_id:       user.id,
      name:           body.name as string,
      description:    (body.description as string | null) ?? null,
      duration_weeks: (body.duration_weeks as number) ?? 4,
      days_per_week:  (body.days_per_week as number) ?? 3,
      goal:           (body.goal as string) ?? 'general_fitness',
      difficulty:     (body.difficulty as string) ?? 'intermediate',
      is_public:      false,
      structure:      body.structure ?? {},
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data }, { status: 201 })
}
