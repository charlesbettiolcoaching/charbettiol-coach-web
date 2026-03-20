import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Ctx = { params: { exerciseId: string } }

/** GET /api/exercises/:exerciseId */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', params.exerciseId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ exercise: data })
}

/**
 * PATCH /api/exercises/:exerciseId
 * Coach-only. Can only edit exercises they created (non-system).
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabase
    .from('exercises')
    .select('created_by, is_system')
    .eq('id', params.exerciseId)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.is_system || existing.created_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const ALLOWED = [
    'name', 'muscle_groups', 'category', 'equipment',
    'movement_type', 'demo_video_url', 'demo_image_url', 'instructions',
  ]
  const patch = Object.fromEntries(
    Object.entries(body).filter(([k]) => ALLOWED.includes(k))
  )

  const { data, error } = await supabase
    .from('exercises')
    .update(patch)
    .eq('id', params.exerciseId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ exercise: data })
}

/** DELETE /api/exercises/:exerciseId */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabase
    .from('exercises')
    .select('created_by, is_system')
    .eq('id', params.exerciseId)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.is_system || existing.created_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', params.exerciseId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
