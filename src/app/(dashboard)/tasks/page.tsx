'use client'

import { useEffect, useState } from 'react'
import { Task, Profile } from '@/lib/types'
import { format, isToday, isThisWeek, isPast, parseISO } from 'date-fns'
import { ListTodo, Plus, X, Check, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import { useIsDemo } from '@/lib/demo/useDemoMode'
import { DEMO_CLIENTS, DEMO_TASKS } from '@/lib/demo/mockData'

type TaskWithClient = Task & { client?: Profile }
type FilterTab = 'all' | 'today' | 'week' | 'completed'

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }
const PRIORITY_COLORS = {
  high: 'bg-cb-danger/15 text-cb-danger border-cb-danger/30',
  medium: 'bg-cb-warning/15 text-cb-warning border-cb-warning/30',
  low: 'bg-surface-light text-cb-secondary border-cb-border',
}
const PRIORITY_DOT = {
  high: 'bg-cb-danger',
  medium: 'bg-cb-warning',
  low: 'bg-cb-secondary',
}

// ── Add Task Modal ──
function AddTaskModal({
  clients,
  onClose,
  onAdd,
}: {
  clients: Profile[]
  onClose: () => void
  onAdd: (task: TaskWithClient) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [clientId, setClientId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [saving, setSaving] = useState(false)

  function handleAdd() {
    if (!title.trim()) return
    setSaving(true)
    const client = clients.find((c) => c.id === clientId)
    const task: TaskWithClient = {
      id: genId(),
      coach_id: 'demo-coach-1',
      client_id: clientId || null,
      title: title.trim(),
      description: description || null,
      due_date: dueDate || null,
      completed: false,
      priority,
      created_at: new Date().toISOString(),
      client,
    }
    setTimeout(() => {
      setSaving(false)
      onAdd(task)
    }, 300)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-cb-border rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-cb-border">
          <h2 className="text-lg font-semibold text-cb-text">Add Task</h2>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-secondary"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-1">Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title…"
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-cb-teal" />
          </div>
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-1">Description</label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes…"
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-cb-teal resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-cb-muted mb-1">Client (optional)</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-secondary focus:outline-none focus:ring-2 focus:ring-cb-teal">
                <option value="">No client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name ?? c.email}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-cb-muted mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:ring-2 focus:ring-cb-teal" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-2">Priority</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button key={p} onClick={() => setPriority(p)}
                  className={clsx('flex-1 py-2 text-xs font-medium rounded-lg border capitalize transition-colors',
                    priority === p ? PRIORITY_COLORS[p] : 'border-cb-border text-cb-secondary hover:border-cb-teal/50'
                  )}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-cb-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-cb-secondary hover:text-cb-text border border-cb-border rounded-lg hover:bg-surface-light transition-colors">Cancel</button>
          <button onClick={handleAdd} disabled={!title.trim() || saving}
            className="px-4 py-2 text-sm bg-cb-teal hover:bg-cb-teal/90 disabled:opacity-50 text-white rounded-lg font-medium">
            Add Task
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Task Row ──
function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: TaskWithClient
  onToggle: () => void
  onDelete: () => void
}) {
  const isOverdue = task.due_date && !task.completed && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date))

  return (
    <div className={clsx(
      'flex items-start gap-3 px-4 py-3 hover:bg-surface-light transition-colors group border-b border-cb-border last:border-0',
      task.completed && 'opacity-60'
    )}>
      <button
        onClick={onToggle}
        className={clsx(
          'mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
          task.completed
            ? 'bg-cb-success border-cb-success'
            : 'border-cb-border hover:border-cb-success'
        )}
      >
        {task.completed && <Check size={10} className="text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <p className={clsx('text-sm font-medium', task.completed ? 'line-through text-cb-muted' : 'text-cb-text')}>
            {task.title}
          </p>
          <span className={clsx('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border capitalize', PRIORITY_COLORS[task.priority])}>
            {task.priority}
          </span>
        </div>
        {task.description && (
          <p className="text-xs text-cb-muted mt-0.5 truncate">{task.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          {task.client && (
            <span className="text-xs text-cb-teal">{task.client.name ?? task.client.email}</span>
          )}
          {task.due_date && (
            <span className={clsx('text-xs', isOverdue ? 'text-cb-danger font-medium' : 'text-cb-muted')}>
              {isOverdue ? 'Overdue · ' : ''}{format(parseISO(task.due_date), 'd MMM yyyy')}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={onDelete}
        className="text-cb-muted hover:text-cb-danger opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ── Main Page ──
export default function TasksPage() {
  const isDemo = useIsDemo()
  const [tasks, setTasks] = useState<TaskWithClient[]>([])
  const [clients, setClients] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [filterClient, setFilterClient] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    setLoading(true)
    if (isDemo) {
      const demoClients = DEMO_CLIENTS as unknown as Profile[]
      setClients(demoClients)
      const enriched: TaskWithClient[] = (DEMO_TASKS as unknown as Task[]).map((t) => ({
        ...t,
        client: demoClients.find((c) => c.id === t.client_id),
      }))
      setTasks(enriched)
      setLoading(false)
      return
    }
    // Graceful fallback: use local state only
    setClients([])
    setTasks([])
    setLoading(false)
  }, [isDemo])

  function toggleTask(id: string) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  function handleAdd(task: TaskWithClient) {
    setTasks((prev) => [task, ...prev])
    setShowAddModal(false)
  }

  // Filtering
  const filtered = tasks.filter((t) => {
    const clientMatch = filterClient === 'all' || t.client_id === filterClient
    let tabMatch = true
    if (activeFilter === 'today') tabMatch = !!t.due_date && isToday(parseISO(t.due_date))
    if (activeFilter === 'week') tabMatch = !!t.due_date && isThisWeek(parseISO(t.due_date), { weekStartsOn: 1 })
    if (activeFilter === 'completed') tabMatch = t.completed
    if (activeFilter === 'all') tabMatch = !t.completed
    return clientMatch && tabMatch
  })

  // Group by priority
  const grouped: Record<string, TaskWithClient[]> = {}
  filtered.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]).forEach((t) => {
    if (!grouped[t.priority]) grouped[t.priority] = []
    grouped[t.priority].push(t)
  })

  const totalCount = tasks.filter((t) => !t.completed).length
  const todayCount = tasks.filter((t) => !t.completed && !!t.due_date && isToday(parseISO(t.due_date))).length
  const overdueCount = tasks.filter((t) => !t.completed && !!t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date))).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-cb-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cb-text">Tasks</h1>
          <p className="text-sm text-cb-muted mt-0.5">Manage your coaching tasks and to-dos</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cb-teal hover:bg-cb-teal/90 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} /> Add Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Open', value: totalCount, color: 'text-cb-text' },
          { label: 'Due Today', value: todayCount, color: 'text-cb-warning' },
          { label: 'Overdue', value: overdueCount, color: 'text-cb-danger' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface border border-cb-border rounded-lg p-3 text-center">
            <p className={clsx('text-xl font-bold', color)}>{value}</p>
            <p className="text-xs text-cb-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex bg-surface border border-cb-border rounded-lg overflow-hidden">
          {([
            { id: 'all', label: 'Open' },
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'completed', label: 'Completed' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={clsx('px-3 py-2 text-xs font-medium transition-colors',
                activeFilter === tab.id ? 'bg-cb-teal text-white' : 'text-cb-secondary hover:text-cb-text hover:bg-surface-light'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)}
          className="px-3 py-2 border border-cb-border rounded-lg text-xs text-cb-secondary bg-surface focus:outline-none focus:ring-2 focus:ring-cb-teal">
          <option value="all">All Clients</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name ?? c.email}</option>)}
        </select>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="bg-surface border border-cb-border rounded-lg p-16 text-center">
          <ListTodo size={36} className="mx-auto text-cb-muted mb-3" />
          <p className="text-sm text-cb-muted">
            {activeFilter === 'completed' ? 'No completed tasks yet.' : 'No tasks found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {(['high', 'medium', 'low'] as const).map((priority) => {
            const group = grouped[priority]
            if (!group || group.length === 0) return null
            return (
              <div key={priority} className="bg-surface border border-cb-border rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-cb-border bg-surface-light">
                  <div className={clsx('w-2 h-2 rounded-full', PRIORITY_DOT[priority])} />
                  <span className="text-xs font-semibold text-cb-secondary uppercase tracking-wide capitalize">{priority} Priority</span>
                  <span className="ml-auto text-xs text-cb-muted">{group.length}</span>
                </div>
                <div>
                  {group.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggle={() => toggleTask(task.id)}
                      onDelete={() => deleteTask(task.id)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAddModal && (
        <AddTaskModal clients={clients} onClose={() => setShowAddModal(false)} onAdd={handleAdd} />
      )}
    </div>
  )
}
