import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/program-templates/[templateId]/export
 * Returns the full template as a JSON file download.
 * Includes an `_export_meta` block for version tracking.
 */
export async function GET(_req: NextRequest, { params }: { params: { templateId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('program_templates')
    .select('*')
    .eq('id', params.templateId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (data.coach_id !== user.id && !data.is_public) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const exportPayload = {
    _export_meta: {
      version: '1.0',
      exported_at: new Date().toISOString(),
      source: 'openclaw',
    },
    name:           data.name,
    description:    data.description,
    duration_weeks: data.duration_weeks,
    days_per_week:  data.days_per_week,
    goal:           data.goal,
    difficulty:     data.difficulty,
    structure:      data.structure,
  }

  const filename = `${data.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_template.json`

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
