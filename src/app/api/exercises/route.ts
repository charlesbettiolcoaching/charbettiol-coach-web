import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/exercises
 * Query params: category, equipment, movement_type, q (name search)
 * Returns full exercise library visible to the authenticated user.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category     = searchParams.get('category')
  const equipment    = searchParams.get('equipment')
  const movementType = searchParams.get('movement_type')
  const q            = searchParams.get('q')

  let query = supabase.from('exercises').select('*').order('name')

  if (category)     query = query.eq('category', category)
  if (movementType) query = query.eq('movement_type', movementType)
  if (equipment)    query = query.contains('equipment', [equipment])
  if (q)            query = query.ilike('name', `%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ exercises: data })
}

/**
 * POST /api/exercises
 * Coach-only. Creates a custom exercise in the library.
 *
 * Body: { name, muscle_groups, category, equipment, movement_type,
 *         demo_video_url?, demo_image_url?, instructions? }
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only coaches can create exercises
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'coach') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { name, muscle_groups, category, equipment, movement_type,
          demo_video_url, demo_image_url, instructions } = body

  if (!name || !category || !movement_type) {
    return NextResponse.json(
      { error: 'name, category, and movement_type are required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('exercises')
    .insert({
      name,
      muscle_groups:  muscle_groups  ?? [],
      category,
      equipment:      equipment      ?? [],
      movement_type,
      demo_video_url: demo_video_url ?? null,
      demo_image_url: demo_image_url ?? null,
      instructions:   instructions   ?? null,
      created_by:     user.id,
      is_system:      false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ exercise: data }, { status: 201 })
}
