import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Ctx = { params: { templateId: string } }

// GET /api/program-templates/[templateId]
export async function GET(_req: NextRequest, { params }: Ctx) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('program_templates')
    .select('*')
    .eq('id', params.templateId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  // Allow owner or any coach if public
  if (data.coach_id !== user.id && !data.is_public) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return NextResponse.json({ template: data })
}

// PATCH /api/program-templates/[templateId]
// Allowed fields: name, description, goal, difficulty, duration_weeks,
//                 days_per_week, is_public, structure, notes
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const ALLOWED = [
    'name', 'description', 'goal', 'difficulty', 'duration_weeks',
    'days_per_week', 'is_public', 'structure', 'notes',
  ]
  const patch: Record<string, unknown> = {}
  for (const key of ALLOWED) {
    if (key in body) patch[key] = body[key]
  }

  const { data, error } = await supabase
    .from('program_templates')
    .update(patch)
    .eq('id', params.templateId)
    .eq('coach_id', user.id)  // only owner can update
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found or not yours' }, { status: 404 })
  return NextResponse.json({ template: data })
}

// DELETE /api/program-templates/[templateId]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('program_templates')
    .delete()
    .eq('id', params.templateId)
    .eq('coach_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
