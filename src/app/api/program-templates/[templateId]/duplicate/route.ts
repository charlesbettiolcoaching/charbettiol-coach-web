import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/program-templates/[templateId]/duplicate
 * Creates a copy of the template owned by the calling coach.
 * Body: { name? }   — defaults to "Copy of <original name>"
 */
export async function POST(req: NextRequest, { params }: { params: { templateId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))

  // Fetch source (own or public)
  const { data: source, error: fetchErr } = await supabase
    .from('program_templates')
    .select('*')
    .eq('id', params.templateId)
    .single()

  if (fetchErr || !source) return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  if (source.coach_id !== user.id && !source.is_public) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('program_templates')
    .insert({
      coach_id:       user.id,
      name:           body.name ?? `Copy of ${source.name}`,
      description:    source.description,
      duration_weeks: source.duration_weeks,
      days_per_week:  source.days_per_week,
      goal:           source.goal,
      difficulty:     source.difficulty,
      is_public:      false,   // copies are private by default
      structure:      source.structure,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data }, { status: 201 })
}
