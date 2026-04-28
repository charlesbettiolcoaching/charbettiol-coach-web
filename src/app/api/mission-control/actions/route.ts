export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import {
  extractTaskIdFromReviewKey,
  validateMissionControlAction,
} from '@/lib/mission-control/actions.mjs'

const ALLOWED_EMAILS = new Set<string>([
  'charlesbettiolbusiness@gmail.com',
  'charlesbettiolcoaching@gmail.com',
])

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json({ error: 'Mission Control actions unavailable' }, { status: 503 })
  }

  const auth = await getAllowedUser(url, anonKey)
  if (auth.ok === false) return auth.response

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const action = validateMissionControlAction(body)
  if (action.ok === false) return NextResponse.json({ error: action.error }, { status: action.status })
  const { reviewKey, source, outcome, note } = action.value

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  if (source === 'supabase_task' && outcome === 'approved') {
    const taskId = extractTaskIdFromReviewKey(reviewKey)
    if (!taskId) return NextResponse.json({ error: 'Invalid task review key' }, { status: 400 })

    const { data: updatedTask, error: taskError } = await admin
      .from('tasks')
      .update({ completed: true })
      .eq('id', taskId)
      .eq('coach_id', auth.user.id)
      .select('id')
      .maybeSingle()

    if (taskError) return NextResponse.json({ error: taskError.message }, { status: 500 })
    if (!updatedTask) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  const { error } = await admin
    .from('mission_control_reviews')
    .upsert({
      coach_id: auth.user.id,
      review_key: reviewKey,
      source,
      outcome,
      note,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'coach_id,review_key' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

async function getAllowedUser(url: string, anonKey: string): Promise<{ ok: true; user: { id: string; email?: string | null } } | { ok: false; response: NextResponse }> {
  const cookieStore = cookies()
  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!ALLOWED_EMAILS.has(user.email ?? '')) return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { ok: true, user: { id: user.id, email: user.email } }
}
