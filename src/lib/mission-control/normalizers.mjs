const VALID_PRIORITY = new Set(['low', 'medium', 'high'])
const VALID_ORIGIN = new Set(['manual', 'check_in', 'message'])

export function normalizeLiveTask(row) {
  const priority = VALID_PRIORITY.has(row.priority) ? row.priority : 'medium'
  const origin = VALID_ORIGIN.has(row.source) ? row.source : 'unknown'
  return {
    id: String(row.id),
    source: 'supabase_task',
    title: String(row.title || 'Untitled task'),
    description: row.description ?? null,
    status: row.completed ? 'done' : 'open',
    priority,
    due_date: row.due_date ?? null,
    created_at: row.created_at || new Date(0).toISOString(),
    client: row.client ? {
      id: String(row.client.id),
      name: row.client.name ?? null,
      email: row.client.email ?? null,
    } : null,
    origin,
    source_url: '/tasks',
  }
}

export function buildTaskDecisionItems(tasks, now = new Date()) {
  return tasks
    .filter(task => task.status === 'open')
    .filter(task => task.priority === 'high' || isOverdue(task, now) || task.origin === 'check_in' || task.origin === 'message')
    .map(task => ({
      id: `decision-task-${task.id}`,
      source: 'supabase_task',
      title: task.title,
      context: taskContext(task, now),
      priority: task.priority === 'high' || isOverdue(task, now) ? 'high' : 'medium',
      created_at: task.created_at,
      source_url: task.source_url,
      review_key: `supabase_task:${task.id}`,
    }))
}

export function buildTaskStaleItems(tasks, now = new Date()) {
  return tasks
    .filter(task => task.status === 'open')
    .map(task => staleReason(task, now))
    .filter(Boolean)
}

export function buildAuditDecisionItems(reports) {
  return reports
    .filter(report => report.status === 'warnings' || report.status === 'errors')
    .map(report => ({
      id: `decision-audit-${report.id}`,
      source: 'audit_report',
      title: `${report.status === 'errors' ? 'Audit errors' : 'Audit warnings'} · ${report.repo}`,
      context: String(report.summary || 'Audit needs review'),
      priority: report.status === 'errors' ? 'high' : 'medium',
      created_at: report.created_at || new Date(0).toISOString(),
      source_url: report.run_url ?? null,
      review_key: `audit_report:${report.id}`,
    }))
}

export function buildAuditActivityItems(reports) {
  return reports.map(report => ({
    id: `audit-${report.id}`,
    source: 'audit_report',
    title: `Argus · ${report.repo} · ${report.status}`,
    summary: String(report.summary || ''),
    created_at: report.created_at || new Date(0).toISOString(),
    source_url: report.run_url ?? null,
  }))
}

export function buildCommitActivityItems(commits) {
  return commits.map(commit => ({
    id: `commit-${commit.id}`,
    source: 'commit_event',
    title: `${commit.repo} · ${(commit.commit_sha || '').slice(0, 7)} · ${(commit.message || '').split('\n')[0]}`,
    summary: `+${commit.insertions || 0} / -${commit.deletions || 0} across ${commit.files_changed || 0} files`,
    created_at: commit.created_at || new Date(0).toISOString(),
    source_url: commit.commit_url ?? null,
  }))
}

function isOverdue(task, now) {
  if (!task.due_date) return false
  const due = new Date(`${task.due_date}T23:59:59.999Z`)
  return due.getTime() < now.getTime()
}

function taskContext(task, now) {
  const client = task.client?.name || task.client?.email
  const bits = []
  if (client) bits.push(`Client: ${client}`)
  if (task.origin !== 'unknown') bits.push(`Origin: ${task.origin.replace('_', ' ')}`)
  if (task.due_date && isOverdue(task, now)) bits.push(`Overdue since ${formatDate(task.due_date)}`)
  if (task.description) bits.push(task.description)
  return bits.join(' · ') || 'Open task needs review.'
}

function staleReason(task, now) {
  const created = new Date(task.created_at)
  const ageDays = Math.max(0, Math.floor((startOfUtcDay(now).getTime() - startOfUtcDay(created).getTime()) / 86400000))
  if (task.due_date && isOverdue(task, now)) {
    return { id: `stale-task-${task.id}`, source: 'supabase_task', title: task.title, reason: `Overdue since ${formatDate(task.due_date)}`, age_days: ageDays, source_url: task.source_url }
  }
  if (task.priority === 'high' && ageDays >= 3) {
    return { id: `stale-task-${task.id}`, source: 'supabase_task', title: task.title, reason: `High priority open for ${ageDays} days`, age_days: ageDays, source_url: task.source_url }
  }
  if (task.priority === 'medium' && ageDays >= 7) {
    return { id: `stale-task-${task.id}`, source: 'supabase_task', title: task.title, reason: `Medium priority open for ${ageDays} days`, age_days: ageDays, source_url: task.source_url }
  }
  return null
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function formatDate(value) {
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}
