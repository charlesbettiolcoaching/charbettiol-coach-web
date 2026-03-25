'use client'

import { useState, useEffect, useCallback } from 'react'
import { useIsDemo } from '@/lib/demo/useDemoMode'
import { Plus, Dumbbell, Loader2 } from 'lucide-react'
import clsx from 'clsx'

const DEMO_PROGRAMS = [
  {
    id: 'prog-1',
    name: 'Fat Loss Foundation',
    weeks: 8,
    daysPerWeek: 4,
    totalExercises: 28,
    assignedClients: ['demo-client-1', 'demo-client-4'],
    isTemplate: true,
    description: 'Progressive overload program focused on fat loss. Combines compound lifts with metabolic finishers.',
    tags: ['Fat Loss', 'Intermediate'],
    lastModified: '2026-03-10',
    createdAt: '2026-01-15',
  },
  {
    id: 'prog-2',
    name: 'Hypertrophy Block A',
    weeks: 6,
    daysPerWeek: 5,
    totalExercises: 35,
    assignedClients: ['demo-client-3'],
    isTemplate: true,
    description: 'Upper/lower split designed for maximum muscle gain. High volume, moderate intensity.',
    tags: ['Muscle Gain', 'Advanced'],
    lastModified: '2026-02-28',
    createdAt: '2025-11-20',
  },
  {
    id: 'prog-3',
    name: 'Beginner Full Body',
    weeks: 12,
    daysPerWeek: 3,
    totalExercises: 18,
    assignedClients: ['demo-client-2', 'demo-client-4'],
    isTemplate: false,
    description: 'Perfect for new clients. 3-day full body routine with emphasis on learning movement patterns.',
    tags: ['Beginner', 'General Fitness'],
    lastModified: '2026-03-05',
    createdAt: '2025-10-01',
  },
  {
    id: 'prog-4',
    name: 'Strength Peaking',
    weeks: 4,
    daysPerWeek: 4,
    totalExercises: 20,
    assignedClients: ['demo-client-3'],
    isTemplate: true,
    description: 'Powerlifting-focused peaking block. Squat, bench, and deadlift specialisation.',
    tags: ['Strength', 'Advanced'],
    lastModified: '2026-03-18',
    createdAt: '2026-02-01',
  },
]

const DEMO_CLIENTS_BRIEF = [
  { id: 'demo-client-1', name: 'Liam Carter', initials: 'LC', color: '#7B68EE' },
  { id: 'demo-client-2', name: 'Sophie Nguyen', initials: 'SN', color: '#34C759' },
  { id: 'demo-client-3', name: 'Jake Wilson', initials: 'JW', color: '#E8A838' },
  { id: 'demo-client-4', name: 'Emma Thompson', initials: 'ET', color: '#E05454' },
]

type FilterTab = 'all' | 'templates' | 'assigned'

type RealProgram = {
  id: string
  name: string
  description: string | null
  duration_weeks: number | null
  days_per_week: number | null
  goal: string | null
  difficulty: string | null
  is_public: boolean
  coach_id: string
  created_at: string
  updated_at: string
}

export default function ProgramsPage() {
  const isDemo = useIsDemo()
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null)
  const [loading, setLoading] = useState(!isDemo)
  const [realPrograms, setRealPrograms] = useState<RealProgram[]>([])
  const [showNewProgramModal, setShowNewProgramModal] = useState(false)
  const [newProgramName, setNewProgramName] = useState('')
  const [newProgramWeeks, setNewProgramWeeks] = useState('8')
  const [newProgramDays, setNewProgramDays] = useState('4')
  const [saving, setSaving] = useState(false)

  const fetchPrograms = useCallback(async () => {
    if (isDemo) return
    setLoading(true)
    try {
      const res = await fetch('/api/program-templates')
      const json = await res.json()
      setRealPrograms(json.templates || [])
    } catch (e) {
      console.error('Failed to fetch programs', e)
    } finally {
      setLoading(false)
    }
  }, [isDemo])

  useEffect(() => { fetchPrograms() }, [fetchPrograms])

  const handleCreateProgram = async () => {
    if (!newProgramName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/program-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProgramName.trim(),
          duration_weeks: parseInt(newProgramWeeks) || 8,
          days_per_week: parseInt(newProgramDays) || 4,
        }),
      })
      if (res.ok) {
        setShowNewProgramModal(false)
        setNewProgramName('')
        fetchPrograms()
      }
    } catch (e) {
      console.error('Failed to create program', e)
    } finally {
      setSaving(false)
    }
  }

  // Normalise real programs to the same shape as demo for rendering
  const normalizedRealPrograms = realPrograms.map(p => ({
    id: p.id,
    name: p.name,
    weeks: p.duration_weeks ?? 8,
    daysPerWeek: p.days_per_week ?? 3,
    totalExercises: 0,
    assignedClients: [] as string[],
    isTemplate: p.is_public,
    description: p.description ?? '',
    tags: [p.goal, p.difficulty].filter(Boolean) as string[],
    lastModified: p.updated_at?.slice(0, 10) ?? '',
    createdAt: p.created_at?.slice(0, 10) ?? '',
  }))

  const programs = isDemo ? DEMO_PROGRAMS : normalizedRealPrograms
  const clients = isDemo ? DEMO_CLIENTS_BRIEF : []

  // Filter programs
  const filteredPrograms = programs.filter(prog => {
    // Filter by tab
    if (filterTab === 'templates' && !prog.isTemplate) return false
    if (filterTab === 'assigned' && prog.isTemplate) return false

    // Filter by search
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        prog.name.toLowerCase().includes(search) ||
        prog.description.toLowerCase().includes(search) ||
        prog.tags.some(tag => tag.toLowerCase().includes(search))
      )
    }

    return true
  })

  // Calculate stats
  const totalPrograms = programs.length
  const totalTemplates = programs.filter(p => p.isTemplate).length
  const avgWeeks = programs.length > 0
    ? (programs.reduce((sum, p) => sum + p.weeks, 0) / programs.length).toFixed(1)
    : '0'
  const uniqueClients = new Set(programs.flatMap(p => p.assignedClients)).size

  const getClientsByIds = (clientIds: string[]) => {
    return clientIds.map(id => clients.find(c => c.id === id)).filter(Boolean) as typeof clients
  }

  const truncateText = (text: string, lines: number) => {
    const lineArray = text.split('\n').slice(0, lines)
    return lineArray.join('\n') + (text.split('\n').length > lines ? '...' : '')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cb-text">Programs</h1>
          <p className="text-sm text-cb-muted mt-0.5">Build and manage training templates</p>
        </div>
        <button
          onClick={() => setShowNewProgramModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors font-medium text-sm"
        >
          <Plus size={16} />
          New Program
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Programs', value: totalPrograms.toString() },
          { label: 'Templates', value: totalTemplates.toString() },
          { label: 'Avg Weeks', value: avgWeeks },
          { label: 'Active Clients', value: uniqueClients.toString() },
        ].map(({ label, value }) => (
          <div key={label} className="bg-surface border border-cb-border rounded-lg p-4">
            <p className="text-xs text-cb-muted mb-1">{label}</p>
            <p className="text-xl font-bold text-cb-text">{value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs and search */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {(['all', 'templates', 'assigned'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={clsx(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                filterTab === tab
                  ? 'bg-brand text-white'
                  : 'bg-surface border border-cb-border text-cb-secondary hover:bg-surface-light'
              )}
            >
              {tab === 'all' ? 'All' : tab === 'templates' ? 'Templates' : 'Assigned'}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search programs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      {/* New Program Modal */}
      {showNewProgramModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-surface border border-cb-border rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <h2 className="text-lg font-bold text-cb-text mb-4">New Program</h2>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-medium text-cb-muted mb-1 block">Program Name</label>
                <input
                  type="text"
                  value={newProgramName}
                  onChange={e => setNewProgramName(e.target.value)}
                  placeholder="e.g. 8-Week Fat Loss"
                  className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-cb-muted mb-1 block">Duration (weeks)</label>
                  <input type="number" min="1" max="52" value={newProgramWeeks} onChange={e => setNewProgramWeeks(e.target.value)} className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text bg-surface focus:outline-none focus:ring-2 focus:ring-brand" />
                </div>
                <div>
                  <label className="text-xs font-medium text-cb-muted mb-1 block">Days/week</label>
                  <input type="number" min="1" max="7" value={newProgramDays} onChange={e => setNewProgramDays(e.target.value)} className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text bg-surface focus:outline-none focus:ring-2 focus:ring-brand" />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowNewProgramModal(false)} className="flex-1 px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-secondary hover:bg-surface-light transition-colors">Cancel</button>
              <button onClick={handleCreateProgram} disabled={saving || !newProgramName.trim()} className="flex-1 px-3 py-2 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Programs grid */}
      {loading ? (
        <div className="bg-surface border border-cb-border rounded-lg p-16 text-center">
          <Loader2 size={24} className="mx-auto text-cb-muted mb-3 animate-spin" />
          <p className="text-cb-muted text-sm">Loading programs...</p>
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div className="bg-surface border border-cb-border rounded-lg p-16 text-center">
          <Dumbbell size={40} className="mx-auto text-cb-muted mb-3" />
          <p className="text-cb-muted">{searchTerm ? 'No programs match your search.' : 'No programs yet. Create your first one!'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {filteredPrograms.map(program => {
            const assignedClients = getClientsByIds(program.assignedClients)
            const isExpanded = expandedProgram === program.id

            return (
              <div key={program.id} className="bg-surface border border-cb-border rounded-lg overflow-hidden">
                {/* Card header - clickable to expand */}
                <button
                  onClick={() => setExpandedProgram(isExpanded ? null : program.id)}
                  className="w-full px-5 py-4 text-left hover:bg-surface-light transition-colors"
                >
                  {/* Program name and template badge */}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-cb-text text-lg">{program.name}</h3>
                    {program.isTemplate && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        Template
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-cb-secondary mb-3 line-clamp-2">
                    {truncateText(program.description, 2)}
                  </p>

                  {/* Tags */}
                  <div className="flex gap-2 mb-4">
                    {program.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-light border border-cb-border text-cb-secondary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Meta row */}
                  <p className="text-xs text-cb-muted mb-4">
                    {program.weeks} weeks · {program.daysPerWeek}x/week · {program.totalExercises} exercises
                  </p>

                  {/* Assigned clients avatars */}
                  <div className="flex items-center gap-2">
                    {assignedClients.slice(0, 3).map(client => (
                      <div
                        key={client.id}
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border border-cb-border"
                        style={{ backgroundColor: client.color + '20' }}
                        title={client.name}
                      >
                        <span className="text-[10px] font-semibold" style={{ color: client.color }}>
                          {client.initials}
                        </span>
                      </div>
                    ))}
                    {assignedClients.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-surface-light border border-cb-border flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-semibold text-cb-muted">
                          +{assignedClients.length - 3}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-cb-border flex items-center justify-between">
                    <p className="text-xs text-cb-muted">
                      Last modified {program.lastModified}
                    </p>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-xs font-medium rounded-lg bg-surface-light border border-cb-border text-cb-secondary hover:bg-brand/5 hover:border-brand transition-colors">
                        Assign
                      </button>
                      <button className="px-3 py-1 text-xs font-medium rounded-lg bg-surface-light border border-cb-border text-cb-secondary hover:bg-brand/5 hover:border-brand transition-colors">
                        Duplicate
                      </button>
                    </div>
                  </div>
                </button>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-cb-border space-y-4 pt-4">
                    {/* Full description */}
                    <div>
                      <p className="text-xs font-semibold text-cb-muted mb-1 uppercase tracking-wide">Description</p>
                      <p className="text-sm text-cb-secondary">{program.description}</p>
                    </div>

                    {/* Week-by-week breakdown */}
                    <div>
                      <p className="text-xs font-semibold text-cb-muted mb-2 uppercase tracking-wide">Week-by-Week</p>
                      <div className="space-y-2">
                        <div className="p-3 bg-surface-light rounded-lg border border-cb-border">
                          <p className="text-xs font-semibold text-cb-text">Week 1-2: Foundation</p>
                          <p className="text-xs text-cb-muted mt-1">Movement pattern learning and base conditioning</p>
                        </div>
                        <div className="p-3 bg-surface-light rounded-lg border border-cb-border">
                          <p className="text-xs font-semibold text-cb-text">Week 3-5: Build</p>
                          <p className="text-xs text-cb-muted mt-1">Progressive overload and intensity increase</p>
                        </div>
                        <div className="p-3 bg-surface-light rounded-lg border border-cb-border">
                          <p className="text-xs font-semibold text-cb-text">Week 6-8: Peak</p>
                          <p className="text-xs text-cb-muted mt-1">Maximum effort phase with deload finisher</p>
                        </div>
                      </div>
                    </div>

                    {/* Assign dropdown */}
                    <div>
                      <label className="text-xs font-semibold text-cb-muted mb-2 block uppercase tracking-wide">
                        Assign to Client
                      </label>
                      <select className="w-full px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-text bg-surface-light focus:outline-none focus:ring-2 focus:ring-brand">
                        <option value="">Select a client...</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Save as template toggle */}
                    <div className="flex items-center justify-between p-3 bg-surface-light rounded-lg border border-cb-border">
                      <p className="text-xs font-semibold text-cb-text">Save as Template</p>
                      <input type="checkbox" className="rounded" defaultChecked={program.isTemplate} />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <button className="flex-1 px-3 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors font-medium text-sm">
                        Edit Program
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
