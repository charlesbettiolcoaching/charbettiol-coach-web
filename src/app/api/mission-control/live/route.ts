export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import {
  buildAuditActivityItems,
  buildAuditDecisionItems,
  buildCommitActivityItems,
  buildTaskDecisionItems,
  buildTaskStaleItems,
  normalizeLiveTask,
} from '@/lib/mission-control/normalizers.mjs'
import type { LiveTask, MissionControlLivePayload } from '@/lib/mission-control/types'

const ALLOWED_EMAILS = new Set<string>([
  'charlesbettiolbusiness@gmail.com',
  'charlesbettiolcoaching@gmail.com',
])

export async function GET() {
  const auth = await getAllowedUser()
  if (auth.ok === false) return auth.response

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: 'Mission Control live source unavailable' }, { status: 503 })
  }

  const [tasks, audits, commits] = await Promise.all([
    fetchSupabase(url, key, 'tasks?select=*,client:profiles!tasks_client_id_fkey(id,name,email)&order=created_at.desc&limit=100'),
    fetchSupabase(url, key, 'audit_reports?select=*&order=created_at.desc&limit=30'),
    fetchSupabase(url, key, 'commit_events?select=*&order=created_at.desc&limit=50'),
  ])

  const liveTasks = tasks.map(normalizeLiveTask) as LiveTask[]
  const payload: MissionControlLivePayload = {
    generated_at: new Date().toISOString(),
    tasks: liveTasks,
    decisions: [
      ...buildTaskDecisionItems(liveTasks),
      ...buildAuditDecisionItems(audits),
    ].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)),
    activity: [
      ...buildAuditActivityItems(audits),
      ...buildCommitActivityItems(commits),
    ].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 80),
    stale: buildTaskStaleItems(liveTasks),
  }

  return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } })
}

async function getAllowedUser(): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  return { ok: true }
}

async function fetchSupabase(url: string, key: string, path: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: 'no-store',
  })
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : []
}
