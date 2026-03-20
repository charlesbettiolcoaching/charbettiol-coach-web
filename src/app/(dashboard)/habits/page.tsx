'use client'

import { useState } from 'react'
import { Target, Plus, X, Search, Trash2, Edit2 } from 'lucide-react'
import { useIsDemo } from '@/lib/demo/useDemoMode'
import { DEMO_CLIENTS } from '@/lib/demo/mockData'
import clsx from 'clsx'

type HabitCategory = 'Nutrition' | 'Training' | 'Sleep' | 'Mindset' | 'Recovery' | 'Hydration'

type HabitTemplate = {
  id: string
  title: string
  category: HabitCategory
  target: string
  unit: string
  streakTracking: boolean
}

type ClientHabit = {
  id: string
  templateId: string
  clientId: string
  title: string
  category: HabitCategory
  completions: boolean[]
  currentStreak: number
  bestStreak: number
}

const CATEGORY_COLORS: Record<HabitCategory, string> = {
  Nutrition: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Training: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Sleep: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Mindset: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Recovery: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  Hydration: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
}

const DEMO_TEMPLATES: HabitTemplate[] = [
  { id: 'ht-1', title: 'Hit daily protein target', category: 'Nutrition', target: '160', unit: 'g protein', streakTracking: true },
  { id: 'ht-2', title: 'Drink 2.5L of water', category: 'Hydration', target: '2500', unit: 'ml', streakTracking: true },
  { id: 'ht-3', title: 'Morning mobility routine', category: 'Recovery', target: '10', unit: 'minutes', streakTracking: true },
  { id: 'ht-4', title: 'In bed by 10pm', category: 'Sleep', target: '10', unit: 'pm', streakTracking: true },
  { id: 'ht-5', title: 'Complete assigned workout', category: 'Training', target: '1', unit: 'session', streakTracking: true },
  { id: 'ht-6', title: '5-minute morning gratitude journal', category: 'Mindset', target: '5', unit: 'minutes', streakTracking: false },
  { id: 'ht-7', title: 'Post-workout protein shake', category: 'Nutrition', target: '1', unit: 'shake', streakTracking: false },
  { id: 'ht-8', title: '8+ hours of sleep', category: 'Sleep', target: '8', unit: 'hours', streakTracking: true },
]

const DEMO_CLIENT_HABITS: ClientHabit[] = [
  {
    id: 'ch-1', templateId: 'ht-1', clientId: 'demo-client-1', title: 'Hit daily protein target',
    category: 'Nutrition', completions: [true, true, false, true, true, true, true], currentStreak: 5, bestStreak: 12,
  },
  {
    id: 'ch-2', templateId: 'ht-5', clientId: 'demo-client-1', title: 'Complete assigned workout',
    category: 'Training', completions: [true, false, true, true, false, true, true], currentStreak: 2, bestStreak: 8,
  },
  {
    id: 'ch-3', templateId: 'ht-2', clientId: 'demo-client-1', title: 'Drink 2.5L of water',
    category: 'Hydration', completions: [true, true, true, false, true, true, true], currentStreak: 3, bestStreak: 14,
  },
  {
    id: 'ch-4', templateId: 'ht-5', clientId: 'demo-client-2', title: 'Complete assigned workout',
    category: 'Training', completions: [true, true, true, true, true, false, true], currentStreak: 1, bestStreak: 21,
  },
  {
    id: 'ch-5', templateId: 'ht-8', clientId: 'demo-client-2', title: '8+ hours of sleep',
    category: 'Sleep', completions: [false, true, true, true, true, true, true], currentStreak: 6, bestStreak: 9,
  },
  {
    id: 'ch-6', templateId: 'ht-6', clientId: 'demo-client-2', title: '5-minute morning gratitude journal',
    category: 'Mindset', completions: [true, false, false, true, true, true, false], currentStreak: 0, bestStreak: 5,
  },
  {
    id: 'ch-7', templateId: 'ht-1', clientId: 'demo-client-3', title: 'Hit daily protein target',
    category: 'Nutrition', completions: [true, true, true, true, false, true, true], currentStreak: 2, bestStreak: 18,
  },
  {
    id: 'ch-8', templateId: 'ht-3', clientId: 'demo-client-3', title: 'Morning mobility routine',
    category: 'Recovery', completions: [false, true, true, true, true, true, true], currentStreak: 6, bestStreak: 6,
  },
  {
    id: 'ch-9', templateId: 'ht-4', clientId: 'demo-client-3', title: 'In bed by 10pm',
    category: 'Sleep', completions: [true, false, true, false, true, false, true], currentStreak: 1, bestStreak: 4,
  },
]

export default function HabitsPage() {
  const isDemo = useIsDemo()
  const [templates, setTemplates] = useState<HabitTemplate[]>(isDemo ? DEMO_TEMPLATES : [])
  const [clientHabits] = useState<ClientHabit[]>(isDemo ? DEMO_CLIENT_HABITS : [])
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<string>(isDemo ? 'demo-client-1' : '')
  const [showNewTemplate, setShowNewTemplate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState<HabitCategory>('Nutrition')
  const [newTarget, setNewTarget] = useState('')
  const [newUnit, setNewUnit] = useState('')

  const clients = isDemo ? DEMO_CLIENTS : []

  const filteredTemplates = templates.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase())
  )

  const selectedClientHabits = clientHabits.filter(h => h.clientId === selectedClient)

  function addTemplate() {
    if (!newTitle.trim()) return
    const t: HabitTemplate = {
      id: 'ht-' + Date.now(),
      title: newTitle.trim(),
      category: newCategory,
      target: newTarget,
      unit: newUnit,
      streakTracking: true,
    }
    setTemplates(prev => [...prev, t])
    setNewTitle('')
    setNewTarget('')
    setNewUnit('')
    setShowNewTemplate(false)
  }

  function deleteTemplate(id: string) {
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  const completionRate = (completions: boolean[]) => {
    const done = completions.filter(Boolean).length
    return Math.round((done / completions.length) * 100)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cb-text">Habits</h1>
        <p className="text-sm text-cb-muted mt-0.5">Build habit templates and track client habit completion</p>
      </div>

      <div className="flex gap-5">
        {/* Left: Habit Library */}
        <div className="w-80 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-cb-text">Habit Library</h2>
            <button onClick={() => setShowNewTemplate(true)}
              className="flex items-center gap-1 text-xs text-brand hover:text-brand-light transition-colors">
              <Plus size={12} /> New
            </button>
          </div>

          {showNewTemplate && (
            <div className="bg-surface border border-cb-border rounded-xl p-4 mb-3 space-y-3">
              <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Habit title..."
                className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand" />
              <select value={newCategory} onChange={e => setNewCategory(e.target.value as HabitCategory)}
                className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-secondary focus:outline-none">
                {(Object.keys(CATEGORY_COLORS) as HabitCategory[]).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input type="text" value={newTarget} onChange={e => setNewTarget(e.target.value)} placeholder="Target"
                  className="flex-1 px-2 py-1.5 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none" />
                <input type="text" value={newUnit} onChange={e => setNewUnit(e.target.value)} placeholder="Unit"
                  className="flex-1 px-2 py-1.5 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowNewTemplate(false)}
                  className="flex-1 py-1.5 text-xs text-cb-secondary border border-cb-border rounded-lg hover:bg-surface-light">Cancel</button>
                <button onClick={addTemplate} disabled={!newTitle.trim()}
                  className="flex-1 py-1.5 text-xs bg-brand text-white rounded-lg hover:bg-brand-light disabled:opacity-50">Add</button>
              </div>
            </div>
          )}

          <div className="relative mb-3">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cb-muted" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search habits..."
              className="w-full pl-8 pr-3 py-1.5 bg-surface border border-cb-border rounded-lg text-xs text-cb-text placeholder-cb-muted focus:outline-none focus:ring-1 focus:ring-brand" />
          </div>

          <div className="space-y-2">
            {filteredTemplates.map(t => (
              <div key={t.id} className="bg-surface border border-cb-border rounded-lg p-3">
                <div className="flex items-start justify-between mb-1.5">
                  <p className="text-sm font-medium text-cb-text leading-snug">{t.title}</p>
                  <button onClick={() => deleteTemplate(t.id)} className="text-cb-muted hover:text-cb-danger ml-2 flex-shrink-0">
                    <X size={13} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium', CATEGORY_COLORS[t.category])}>
                    {t.category}
                  </span>
                  {t.target && <span className="text-[10px] text-cb-muted">{t.target} {t.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Client Habits */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-cb-text">Client Habits</h2>
            <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
              className="px-3 py-1.5 bg-surface border border-cb-border rounded-lg text-sm text-cb-secondary focus:outline-none focus:ring-2 focus:ring-brand">
              {!selectedClient && <option value="">Select client...</option>}
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {!selectedClient ? (
            <div className="bg-surface border border-cb-border rounded-xl p-12 text-center">
              <Target size={36} className="mx-auto text-cb-muted mb-3" />
              <p className="text-sm text-cb-muted">Select a client to view their habits.</p>
            </div>
          ) : selectedClientHabits.length === 0 ? (
            <div className="bg-surface border border-cb-border rounded-xl p-12 text-center">
              <p className="text-sm text-cb-muted">No habits assigned to this client yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedClientHabits.map(habit => {
                const rate = completionRate(habit.completions)
                return (
                  <div key={habit.id} className="bg-surface border border-cb-border rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-cb-text">{habit.title}</p>
                        <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium', CATEGORY_COLORS[habit.category])}>
                          {habit.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-cb-muted">Completion (7d)</p>
                        <p className="text-lg font-bold text-cb-text">{rate}%</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-3">
                      {habit.completions.map((done, i) => (
                        <div key={i} className={clsx(
                          'w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-medium',
                          done ? 'bg-brand-bg border-brand text-brand' : 'bg-surface-light border-cb-border text-cb-muted'
                        )}>
                          {['M','T','W','T','F','S','S'][i]}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-cb-muted">
                      <span>Current streak: <span className="font-semibold text-cb-secondary">{habit.currentStreak}d</span></span>
                      <span>Best: <span className="font-semibold text-cb-secondary">{habit.bestStreak}d</span></span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
