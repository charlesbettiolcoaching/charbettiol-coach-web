export type LiveTask = {
  id: string
  source: 'supabase_task'
  title: string
  description: string | null
  status: 'open' | 'done'
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  created_at: string
  client: { id: string; name: string | null; email: string | null } | null
  origin: 'manual' | 'check_in' | 'message' | 'unknown'
  source_url: string
}

export type DecisionItem = {
  id: string
  source: 'supabase_task' | 'audit_report' | 'commit_event' | 'local_overlay'
  title: string
  context: string
  priority: 'low' | 'medium' | 'high'
  created_at: string
  source_url: string | null
  review_key: string
}

export type ActivityItem = {
  id: string
  source: 'audit_report' | 'commit_event' | 'supabase_task' | 'mission_control_review'
  title: string
  summary: string
  created_at: string
  source_url: string | null
}

export type StaleItem = {
  id: string
  source: 'supabase_task'
  title: string
  reason: string
  age_days: number
  source_url: string
}

export type MissionControlLivePayload = {
  generated_at: string
  tasks: LiveTask[]
  decisions: DecisionItem[]
  activity: ActivityItem[]
  stale: StaleItem[]
  reviewed: ActivityItem[]
}
