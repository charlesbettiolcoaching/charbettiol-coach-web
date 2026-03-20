'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { WorkoutProgram, WorkoutExercise, ExerciseSet, Profile } from '@/lib/types'
import { format } from 'date-fns'
import {
  Dumbbell, ChevronLeft, Plus, Search, X, Sparkles, Loader2,
  Trash2, Save, GripVertical, ChevronDown, ChevronUp,
  MoreHorizontal, RefreshCw, ArrowUpCircle, ArrowDownCircle,
  LayoutGrid, Timer, Infinity, Clock, Library, BookOpen,
} from 'lucide-react'
import clsx from 'clsx'
import { useIsDemo } from '@/lib/demo/useDemoMode'
import { DEMO_CLIENTS, DEMO_PROGRAMS } from '@/lib/demo/mockData'
import { EXERCISES, Exercise } from '@/lib/exercises'
import ExerciseLibrary from '@/components/ExerciseLibrary'
import ProgramBuilderTab from '@/components/training/ProgramBuilderTab'
import ProgramTemplatesTab from '@/components/training/ProgramTemplatesTab'
import AIWorkoutWizard from '@/components/ai/AIWorkoutWizard'

// ── Local types for builder state ──
type BuilderSet = {
  id: string
  set_number: number
  target_reps: number
  target_weight_kg: number | null
}

type BuilderExercise = {
  id: string
  name: string
  muscle_group: string
  notes: string
  rest_seconds: number
  sets: BuilderSet[]
}

type BuilderDay = {
  id: string
  day_number: number
  name: string
  exercises: BuilderExercise[]
}

type ProgramWithClient = WorkoutProgram & { client?: Profile }

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Core', 'Cardio', 'Full Body']
const EQUIPMENT_GROUPS = ['All', 'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight']

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function makeDemoExercise(name: string, muscleGroup = 'Various'): BuilderExercise {
  return {
    id: genId(),
    name,
    muscle_group: muscleGroup,
    notes: '',
    rest_seconds: 90,
    sets: [
      { id: genId(), set_number: 1, target_reps: 8, target_weight_kg: null },
      { id: genId(), set_number: 2, target_reps: 8, target_weight_kg: null },
      { id: genId(), set_number: 3, target_reps: 8, target_weight_kg: null },
    ],
  }
}

function programToBuilderDays(prog: WorkoutProgram): BuilderDay[] {
  const dayTemplates = [
    { name: 'Upper A', exercises: ['Bench Press', 'Barbell Row', 'Overhead Press', 'Pull Up'] },
    { name: 'Lower A', exercises: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl'] },
    { name: 'Upper B', exercises: ['Incline Dumbbell Press', 'Lat Pulldown', 'Dumbbell Shoulder Press'] },
    { name: 'Lower B', exercises: ['Deadlift', 'Bulgarian Split Squat', 'Hip Thrust'] },
    { name: 'Full Body', exercises: ['Squat', 'Bench Press', 'Barbell Row'] },
  ]
  return Array.from({ length: prog.days_per_week }, (_, i) => {
    const tmpl = dayTemplates[i % dayTemplates.length]
    return {
      id: genId(),
      day_number: i + 1,
      name: tmpl.name,
      exercises: tmpl.exercises.map((n) => makeDemoExercise(n)),
    }
  })
}

// ── New Program Modal ──
function NewProgramModal({
  clients,
  onClose,
  onAdd,
}: {
  clients: Profile[]
  onClose: () => void
  onAdd: (prog: ProgramWithClient) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [programType, setProgramType] = useState<'fixed' | 'calendar'>('fixed')
  const [clientId, setClientId] = useState<string>('')
  const [weeks, setWeeks] = useState(8)
  const [daysPerWeek, setDaysPerWeek] = useState(4)
  const [saving, setSaving] = useState(false)

  function handleAdd() {
    if (!name.trim()) return
    setSaving(true)
    const client = clients.find((c) => c.id === clientId)
    const prog: ProgramWithClient = {
      id: genId(),
      client_id: clientId || 'template',
      coach_id: 'demo-coach-1',
      name: name.trim(),
      description: description || null,
      goal: null,
      weeks,
      current_week: 1,
      days_per_week: daysPerWeek,
      is_active: true,
      ai_generated: false,
      coach_approved: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      client,
    }
    setTimeout(() => {
      setSaving(false)
      onAdd(prog)
    }, 400)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-cb-border rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-cb-border">
          <h2 className="text-lg font-semibold text-cb-text">New Program</h2>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-secondary"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-1">Program Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hypertrophy Block A"
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-cb-teal"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the program…"
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-cb-teal resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-2">Program Type</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'fixed', label: 'Fixed', desc: 'A set of workout days that repeat each week (e.g. Upper/Lower).' },
                { value: 'calendar', label: 'Calendar', desc: 'Workouts scheduled on specific calendar dates.' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setProgramType(opt.value as 'fixed' | 'calendar')}
                  className={clsx(
                    'text-left p-3 rounded-lg border transition-colors',
                    programType === opt.value
                      ? 'border-cb-teal bg-cb-teal/10'
                      : 'border-cb-border bg-surface-light hover:border-cb-teal/50'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={clsx('w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center',
                      programType === opt.value ? 'border-cb-teal' : 'border-cb-muted'
                    )}>
                      {programType === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-cb-teal" />}
                    </div>
                    <span className="text-sm font-medium text-cb-text">{opt.label}</span>
                  </div>
                  <p className="text-xs text-cb-muted leading-relaxed">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-1">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-secondary focus:outline-none focus:ring-2 focus:ring-cb-teal"
            >
              <option value="">Template (no client)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name ?? c.email}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-cb-muted mb-1">Weeks</label>
              <input
                type="number"
                min={1}
                max={52}
                value={weeks}
                onChange={(e) => setWeeks(Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:ring-2 focus:ring-cb-teal"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-cb-muted mb-1">Days per Week</label>
              <input
                type="number"
                min={1}
                max={7}
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:ring-2 focus:ring-cb-teal"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-cb-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-cb-secondary hover:text-cb-text border border-cb-border rounded-lg hover:bg-surface-light transition-colors">Close</button>
          <button
            onClick={handleAdd}
            disabled={!name.trim() || saving}
            className="px-4 py-2 text-sm bg-cb-teal hover:bg-cb-teal/90 disabled:opacity-50 text-white rounded-lg font-medium flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Add Program
          </button>
        </div>
      </div>
    </div>
  )
}

// ── AI Generate Modal ──
function AIGenerateModal({
  clients,
  onClose,
  onSave,
}: {
  clients: Profile[]
  onClose: () => void
  onSave: (prog: ProgramWithClient) => void
}) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? '')
  const [goal, setGoal] = useState('')
  const [daysPerWeek, setDaysPerWeek] = useState(4)
  const [weeks, setWeeks] = useState(8)
  const [experience, setExperience] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate')
  const [programType, setProgramType] = useState<'fixed' | 'calendar'>('fixed')
  const [loading, setLoading] = useState(false)
  const [generatedDays, setGeneratedDays] = useState<BuilderDay[] | null>(null)
  const [saving, setSaving] = useState(false)

  const selectedClient = clients.find((c) => c.id === clientId)

  async function generate() {
    setLoading(true)
    setGeneratedDays(null)
    try {
      const res = await fetch('/api/ai/generate-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: selectedClient?.name ?? 'Client',
          goal: goal || selectedClient?.goal || 'Build muscle',
          daysPerWeek,
          weeks,
          injuries: selectedClient?.injuries,
          experience,
          programType,
        }),
      })
      const data = await res.json()
      if (data.program?.days) {
        const days: BuilderDay[] = data.program.days.map((d: {
          day_number: number; name: string; exercises: Array<{
            name: string; muscle_group?: string; notes?: string; rest_seconds?: number; sets: Array<{
              set_number: number; target_reps: number; target_weight_kg: number | null
            }>
          }>
        }) => ({
          id: genId(),
          day_number: d.day_number,
          name: d.name,
          exercises: d.exercises.map((ex) => ({
            id: genId(),
            name: ex.name,
            muscle_group: ex.muscle_group ?? 'Various',
            notes: ex.notes ?? '',
            rest_seconds: ex.rest_seconds ?? 90,
            sets: ex.sets.map((s) => ({ id: genId(), set_number: s.set_number, target_reps: s.target_reps, target_weight_kg: s.target_weight_kg })),
          })),
        }))
        setGeneratedDays(days)
      }
    } catch {
      // fall back to mock
    }
    setLoading(false)
  }

  function handleSave() {
    if (!generatedDays) return
    setSaving(true)
    const client = clients.find((c) => c.id === clientId)
    const prog: ProgramWithClient = {
      id: genId(),
      client_id: clientId,
      coach_id: 'demo-coach-1',
      name: `AI Program — ${selectedClient?.name ?? 'Client'}`,
      description: `${weeks}-week ${daysPerWeek}x/week program. Goal: ${goal}`,
      goal: goal || null,
      weeks,
      current_week: 1,
      days_per_week: daysPerWeek,
      is_active: true,
      ai_generated: true,
      coach_approved: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      client,
    }
    setTimeout(() => {
      setSaving(false)
      onSave(prog)
    }, 400)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-cb-border rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-cb-border">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-cb-teal" />
            <h2 className="text-lg font-semibold text-cb-text">AI Workout Generator</h2>
          </div>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-secondary"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-1">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-secondary focus:outline-none focus:ring-2 focus:ring-cb-teal"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name ?? c.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-1">Goal</label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={selectedClient?.goal ?? 'e.g. Build muscle, lose fat…'}
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-cb-teal"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-cb-muted mb-1">Days / Week</label>
              <input type="number" min={1} max={6} value={daysPerWeek} onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:ring-2 focus:ring-cb-teal" />
            </div>
            <div>
              <label className="block text-xs font-medium text-cb-muted mb-1">Weeks</label>
              <input type="number" min={4} max={16} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:ring-2 focus:ring-cb-teal" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-2">Experience Level</label>
            <div className="flex gap-2">
              {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                <button key={lvl} onClick={() => setExperience(lvl)}
                  className={clsx('flex-1 py-2 text-xs font-medium rounded-lg border transition-colors',
                    experience === lvl ? 'border-cb-teal bg-cb-teal/10 text-cb-teal' : 'border-cb-border text-cb-secondary hover:border-cb-teal/50'
                  )}>
                  {lvl}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-2">Program Type</label>
            <div className="flex gap-2">
              {(['fixed', 'calendar'] as const).map((t) => (
                <button key={t} onClick={() => setProgramType(t)}
                  className={clsx('flex-1 py-2 text-xs font-medium rounded-lg border capitalize transition-colors',
                    programType === t ? 'border-cb-teal bg-cb-teal/10 text-cb-teal' : 'border-cb-border text-cb-secondary hover:border-cb-teal/50'
                  )}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {!generatedDays && (
            <button
              onClick={generate}
              disabled={loading}
              className="w-full py-2.5 bg-cb-teal hover:bg-cb-teal/90 disabled:opacity-60 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <><Sparkles size={16} /> Generate Program</>}
            </button>
          )}

          {generatedDays && (
            <div className="space-y-3">
              <div className="bg-surface-light rounded-lg p-4 border border-cb-border">
                <p className="text-xs font-semibold text-cb-teal mb-2 uppercase tracking-wide">Generated Program Preview</p>
                <div className="space-y-1.5">
                  {generatedDays.map((day) => (
                    <div key={day.id} className="flex items-center justify-between text-sm">
                      <span className="text-cb-text font-medium">Day {day.day_number}: {day.name}</span>
                      <span className="text-cb-muted text-xs">{day.exercises.length} exercises</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setGeneratedDays(null); generate() }} disabled={loading}
                  className="flex-1 py-2 border border-cb-border text-sm text-cb-secondary hover:bg-surface-light rounded-lg transition-colors">
                  Regenerate
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2 bg-cb-teal hover:bg-cb-teal/90 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  Save Program
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Add Section Modal ──
type SectionType = 'regular' | 'interval' | 'amrap' | 'circuit'
function AddSectionModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, type: SectionType) => void }) {
  const [name, setName] = useState('')
  const [sectionType, setSectionType] = useState<SectionType>('regular')
  const SECTION_TYPES: { type: SectionType; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    { type: 'regular', label: 'Regular', desc: 'Regular blocks. Perfect for strength training, warmups, cooldown, and more', icon: <LayoutGrid size={20} />, color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
    { type: 'interval', label: 'Interval', desc: 'Follow-along intervals. Perfect for HIIT, Tabata, and more', icon: <Timer size={20} />, color: 'text-cb-warning bg-cb-warning/10 border-cb-warning/30' },
    { type: 'amrap', label: 'AMRAP', desc: 'Track as many rounds as possible within a set time', icon: <Infinity size={20} />, color: 'text-cb-success bg-cb-success/10 border-cb-success/30' },
    { type: 'circuit', label: 'Circuit', desc: 'Repeat a set of exercises for multiple rounds', icon: <Clock size={20} />, color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
  ]
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-cb-border rounded-xl w-full max-w-2xl shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-cb-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 border-2 border-dashed border-cb-muted rounded flex items-center justify-center">
              <span className="text-cb-muted text-xs font-bold">+</span>
            </div>
            <h2 className="text-lg font-semibold text-cb-text">Add Section</h2>
          </div>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-secondary"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-cb-muted mb-1">Section Name <span className="text-cb-danger">*</span></label>
            <input
              type="text" autoFocus value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Name of the section e.g. Cooldown"
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {SECTION_TYPES.map((s) => (
              <button key={s.type} onClick={() => setSectionType(s.type)}
                className={clsx('text-left p-4 rounded-xl border-2 transition-all',
                  sectionType === s.type ? 'border-brand bg-brand/5' : 'border-cb-border hover:border-cb-muted'
                )}>
                <div className="flex items-start gap-3">
                  <div className={clsx('w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0', s.color)}>{s.icon}</div>
                  <div>
                    <p className="text-sm font-semibold text-cb-text">{s.label}</p>
                    <p className="text-xs text-cb-muted leading-relaxed mt-0.5">{s.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between p-5 border-t border-cb-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-cb-secondary hover:text-cb-text">Close</button>
          <button onClick={() => { if (name.trim()) { onAdd(name.trim(), sectionType); onClose() } }}
            disabled={!name.trim()}
            className="px-5 py-2 bg-brand hover:bg-brand/90 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors">
            Add Section
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Exercise Card in Builder ──
function ExerciseCard({
  exercise,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  exercise: BuilderExercise
  onUpdate: (ex: BuilderExercise) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  function updateSet(setId: string, field: keyof BuilderSet, value: string | number | null) {
    onUpdate({
      ...exercise,
      sets: exercise.sets.map((s) => s.id === setId ? { ...s, [field]: value } : s),
    })
  }

  function addSet() {
    const nextNum = (exercise.sets[exercise.sets.length - 1]?.set_number ?? 0) + 1
    onUpdate({
      ...exercise,
      sets: [...exercise.sets, { id: genId(), set_number: nextNum, target_reps: 8, target_weight_kg: null }],
    })
  }

  function removeSet(setId: string) {
    onUpdate({
      ...exercise,
      sets: exercise.sets.filter((s) => s.id !== setId).map((s, i) => ({ ...s, set_number: i + 1 })),
    })
  }

  return (
    <div className="bg-surface-light border border-cb-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <GripVertical size={16} className="text-cb-muted cursor-grab flex-shrink-0" />
        <input
          type="text"
          value={exercise.name}
          onChange={(e) => onUpdate({ ...exercise, name: e.target.value })}
          className="flex-1 bg-transparent text-sm font-medium text-cb-text focus:outline-none"
        />
        <span className="text-xs text-cb-muted bg-surface px-2 py-0.5 rounded-full">{exercise.muscle_group}</span>
        <button onClick={() => setCollapsed(!collapsed)} className="text-cb-muted hover:text-cb-secondary">
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
        <div className="relative ml-1">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={clsx('p-1 rounded border transition-colors', showMenu ? 'border-brand text-brand bg-brand/10' : 'border-transparent text-cb-muted hover:text-cb-secondary hover:border-cb-border')}
          >
            <MoreHorizontal size={16} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 z-20 bg-surface border border-cb-border rounded-xl shadow-2xl w-44 py-1 overflow-hidden">
              <button onClick={() => { onUpdate({ ...exercise, notes: exercise.notes ? exercise.notes + '\nAlternative: ' : 'Alternative: ' }); setShowMenu(false) }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-cb-text hover:bg-surface-light transition-colors">
                <RefreshCw size={15} className="text-cb-muted" /> Add Alternative
              </button>
              <button onClick={() => { onMoveUp(); setShowMenu(false) }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-cb-text hover:bg-surface-light transition-colors">
                <ArrowUpCircle size={15} className="text-cb-muted" /> Move Up
              </button>
              <button onClick={() => { onMoveDown(); setShowMenu(false) }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-cb-text hover:bg-surface-light transition-colors">
                <ArrowDownCircle size={15} className="text-cb-muted" /> Move Down
              </button>
              <div className="h-px bg-cb-border mx-2 my-1" />
              <button onClick={() => { onDelete(); setShowMenu(false) }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-cb-danger hover:bg-cb-danger/10 transition-colors">
                <Trash2 size={15} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="border-t border-cb-border">
          <div className="p-3">
            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <label className="block text-[10px] text-cb-muted mb-1">Notes</label>
                <input
                  type="text"
                  value={exercise.notes}
                  onChange={(e) => onUpdate({ ...exercise, notes: e.target.value })}
                  placeholder="Technique cue or note…"
                  className="w-full px-2 py-1.5 bg-surface border border-cb-border rounded text-xs text-cb-text placeholder-cb-muted focus:outline-none focus:ring-1 focus:ring-cb-teal"
                />
              </div>
              <div className="w-24">
                <label className="block text-[10px] text-cb-muted mb-1">Rest (sec)</label>
                <input
                  type="number"
                  value={exercise.rest_seconds}
                  onChange={(e) => onUpdate({ ...exercise, rest_seconds: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 bg-surface border border-cb-border rounded text-xs text-cb-text focus:outline-none focus:ring-1 focus:ring-cb-teal"
                />
              </div>
            </div>
            {/* Sets table */}
            <div className="border border-cb-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-0 bg-surface px-3 py-1.5">
                <div className="col-span-1 text-[10px] font-semibold text-cb-muted uppercase">Set</div>
                <div className="col-span-4 text-[10px] font-semibold text-cb-muted uppercase">Reps</div>
                <div className="col-span-5 text-[10px] font-semibold text-cb-muted uppercase">Weight (kg)</div>
                <div className="col-span-2" />
              </div>
              {exercise.sets.map((set) => (
                <div key={set.id} className="grid grid-cols-12 gap-0 px-3 py-1 border-t border-cb-border items-center">
                  <div className="col-span-1 text-xs text-cb-muted">{set.set_number}</div>
                  <div className="col-span-4 pr-2">
                    <input
                      type="number"
                      min={1}
                      value={set.target_reps}
                      onChange={(e) => updateSet(set.id, 'target_reps', Number(e.target.value))}
                      className="w-full px-2 py-1 bg-surface-light border border-cb-border rounded text-xs text-cb-text focus:outline-none focus:ring-1 focus:ring-cb-teal"
                    />
                  </div>
                  <div className="col-span-5 pr-2">
                    <input
                      type="number"
                      min={0}
                      step={2.5}
                      value={set.target_weight_kg ?? ''}
                      onChange={(e) => updateSet(set.id, 'target_weight_kg', e.target.value === '' ? null : Number(e.target.value))}
                      placeholder="—"
                      className="w-full px-2 py-1 bg-surface-light border border-cb-border rounded text-xs text-cb-text placeholder-cb-muted focus:outline-none focus:ring-1 focus:ring-cb-teal"
                    />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button onClick={() => removeSet(set.id)} className="text-cb-muted hover:text-cb-danger">
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addSet}
              className="mt-2 text-xs text-cb-teal hover:text-cb-teal/80 flex items-center gap-1"
            >
              <Plus size={12} /> Add Set
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ──
export default function TrainingPage() {
  const isDemo = useIsDemo()
  const [activeView, setActiveView] = useState<'programs' | 'templates' | 'library'>('programs')
  const [programs, setPrograms] = useState<ProgramWithClient[]>([])
  const [clients, setClients] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [openProgram, setOpenProgram] = useState<ProgramWithClient | null>(null)
  const [builderDays, setBuilderDays] = useState<BuilderDay[]>([])
  const [activeDay, setActiveDay] = useState<string | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [showSectionModal, setShowSectionModal] = useState(false)

  // Library filters
  const [libSearch, setLibSearch] = useState('')
  const [libMuscle, setLibMuscle] = useState('All')
  const [libEquip, setLibEquip] = useState('All')

  const loadData = useCallback(async () => {
    setLoading(true)
    if (isDemo) {
      const demoClients = DEMO_CLIENTS as unknown as Profile[]
      setClients(demoClients)
      const enriched: ProgramWithClient[] = DEMO_PROGRAMS.map((p) => ({
        ...(p as unknown as WorkoutProgram),
        client: demoClients.find((c) => c.id === p.client_id),
      }))
      setPrograms(enriched)
      setLoading(false)
      return
    }
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data: clientData } = await supabase.from('profiles').select('*').eq('coach_id', user.id).eq('role', 'client')
    setClients(clientData ?? [])
    const clientIds = (clientData ?? []).map((c: Profile) => c.id)
    if (clientIds.length === 0) { setPrograms([]); setLoading(false); return }
    const { data: programData } = await supabase.from('workout_programs').select('*').in('client_id', clientIds).order('created_at', { ascending: false })
    const enriched: ProgramWithClient[] = (programData ?? []).map((p: WorkoutProgram) => ({
      ...p,
      client: (clientData ?? []).find((c: Profile) => c.id === p.client_id),
    }))
    setPrograms(enriched)
    setLoading(false)
  }, [isDemo])

  useEffect(() => { loadData() }, [loadData])

  function openBuilder(prog: ProgramWithClient) {
    setOpenProgram(prog)
    const days = programToBuilderDays(prog)
    setBuilderDays(days)
    setActiveDay(days[0]?.id ?? null)
  }

  function closeBuilder() {
    setOpenProgram(null)
    setBuilderDays([])
    setActiveDay(null)
  }

  function addDay() {
    const num = builderDays.length + 1
    const newDay: BuilderDay = {
      id: genId(),
      day_number: num,
      name: `Day ${num}`,
      exercises: [],
    }
    setBuilderDays((prev) => [...prev, newDay])
    setActiveDay(newDay.id)
  }

  function addExerciseToDay(ex: Exercise) {
    if (!activeDay) return
    setBuilderDays((prev) =>
      prev.map((d) =>
        d.id === activeDay
          ? { ...d, exercises: [...d.exercises, makeDemoExercise(ex.name, ex.muscle_group)] }
          : d
      )
    )
  }

  function addExerciseToDayFromName(name: string) {
    if (!activeDay) return
    setBuilderDays((prev) =>
      prev.map((d) =>
        d.id === activeDay
          ? { ...d, exercises: [...d.exercises, makeDemoExercise(name)] }
          : d
      )
    )
  }

  function updateExercise(dayId: string, exId: string, updated: BuilderExercise) {
    setBuilderDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? { ...d, exercises: d.exercises.map((e) => e.id === exId ? updated : e) }
          : d
      )
    )
  }

  function deleteExercise(dayId: string, exId: string) {
    setBuilderDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? { ...d, exercises: d.exercises.filter((e) => e.id !== exId) }
          : d
      )
    )
  }

  function moveExercise(dayId: string, exId: string, dir: 'up' | 'down') {
    setBuilderDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d
        const idx = d.exercises.findIndex((e) => e.id === exId)
        if (idx === -1) return d
        const newEx = [...d.exercises]
        const swap = dir === 'up' ? idx - 1 : idx + 1
        if (swap < 0 || swap >= newEx.length) return d
        ;[newEx[idx], newEx[swap]] = [newEx[swap], newEx[idx]]
        return { ...d, exercises: newEx }
      })
    )
  }

  function addSection(name: string, type: SectionType) {
    if (!activeDay) return
    // Add a divider/header exercise to mark the section
    setBuilderDays((prev) =>
      prev.map((d) =>
        d.id === activeDay
          ? { ...d, exercises: [...d.exercises, { id: genId(), name: `── ${name} (${type.toUpperCase()}) ──`, muscle_group: 'Section', notes: type, rest_seconds: 0, sets: [] }] }
          : d
      )
    )
  }

  function handleAddProgram(prog: ProgramWithClient) {
    setPrograms((prev) => [prog, ...prev])
    setShowNewModal(false)
    openBuilder(prog)
  }

  function handleAISave(prog: ProgramWithClient, aiDays?: BuilderDay[]) {
    setPrograms((prev) => [prog, ...prev])
    setShowAIModal(false)
    openBuilder(prog)
    if (aiDays && aiDays.length > 0) {
      setBuilderDays(aiDays)
    }
  }

  // Filtered exercises
  const filteredExercises = EXERCISES.filter((ex) => {
    const matchSearch = ex.name.toLowerCase().includes(libSearch.toLowerCase())
    const matchMuscle = libMuscle === 'All' || ex.muscle_group === libMuscle
    const matchEquip = libEquip === 'All' || ex.equipment === libEquip
    return matchSearch && matchMuscle && matchEquip
  })

  const activeDayData = builderDays.find((d) => d.id === activeDay)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-cb-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Tab bar ── */}
      <div className="flex-shrink-0 flex items-center gap-0 px-5 border-b border-cb-border bg-surface">
        {([
          { id: 'programs',  label: 'Programs',          icon: Dumbbell  },
          { id: 'templates', label: 'Templates',          icon: BookOpen  },
          { id: 'library',   label: 'Exercise Library',  icon: Library   },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeView === tab.id
                ? 'border-brand text-brand'
                : 'border-transparent text-cb-secondary hover:text-cb-text'
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeView === 'library' ? (
        <ExerciseLibrary isDemo={isDemo} />
      ) : activeView === 'templates' ? (
        <ProgramTemplatesTab />
      ) : activeView === 'programs' ? (
        <ProgramBuilderTab />
      ) : (
      <div className="flex flex-1 overflow-hidden">
      {/* ── Left Panel: Exercise Library ── */}
      <div className="w-72 flex-shrink-0 border-r border-cb-border flex flex-col bg-surface h-full overflow-hidden">
        <div className="p-4 border-b border-cb-border">
          <p className="text-[10px] font-semibold text-cb-muted uppercase tracking-widest mb-2">
            EXERCISES <span className="text-cb-teal">({filteredExercises.length})</span>
          </p>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cb-muted" />
            <input
              type="text"
              value={libSearch}
              onChange={(e) => setLibSearch(e.target.value)}
              placeholder="Search exercises…"
              className="w-full pl-8 pr-3 py-1.5 bg-surface-light border border-cb-border rounded-lg text-xs text-cb-text placeholder-cb-muted focus:outline-none focus:ring-1 focus:ring-cb-teal"
            />
            {libSearch && (
              <button onClick={() => setLibSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cb-muted hover:text-cb-secondary">
                <X size={12} />
              </button>
            )}
          </div>
          {/* Muscle group pills */}
          <div className="flex flex-wrap gap-1 mb-2">
            {MUSCLE_GROUPS.map((mg) => (
              <button
                key={mg}
                onClick={() => setLibMuscle(mg)}
                className={clsx(
                  'px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors',
                  libMuscle === mg ? 'bg-cb-teal text-white' : 'bg-surface-light text-cb-secondary hover:bg-cb-border'
                )}
              >
                {mg}
              </button>
            ))}
          </div>
          {/* Equipment pills */}
          <div className="flex flex-wrap gap-1">
            {EQUIPMENT_GROUPS.map((eq) => (
              <button
                key={eq}
                onClick={() => setLibEquip(eq)}
                className={clsx(
                  'px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors',
                  libEquip === eq ? 'bg-cb-teal/20 text-cb-teal border border-cb-teal/40' : 'bg-surface-light text-cb-secondary hover:bg-cb-border border border-transparent'
                )}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredExercises.length === 0 ? (
            <p className="text-xs text-cb-muted text-center py-8">No exercises found.</p>
          ) : (
            <div className="divide-y divide-cb-border">
              {filteredExercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => openProgram ? addExerciseToDay(ex) : undefined}
                  className={clsx(
                    'w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors group',
                    openProgram ? 'hover:bg-surface-light cursor-pointer' : 'cursor-default'
                  )}
                  title={openProgram ? `Add ${ex.name} to ${activeDayData?.name ?? 'current day'}` : 'Open a program to add exercises'}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-cb-text truncate">{ex.name}</p>
                    <p className="text-[10px] text-cb-muted">{ex.muscle_group} · {ex.equipment}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    {openProgram && (
                      <Plus size={14} className="text-cb-muted group-hover:text-cb-teal transition-colors" />
                    )}
                    <GripVertical size={14} className="text-cb-muted opacity-40" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right Panel: Builder / Programs ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {!openProgram ? (
          // Programs list
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-cb-text">Training Programs</h1>
                <p className="text-sm text-cb-muted mt-0.5">Build and manage workout programs for your clients</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAIModal(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-cb-teal/50 text-cb-teal hover:bg-cb-teal/10 rounded-lg text-sm font-medium transition-colors"
                >
                  <Sparkles size={15} /> AI Generate
                </button>
                <button
                  onClick={() => setShowNewModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-cb-teal hover:bg-cb-teal/90 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus size={15} /> New Program
                </button>
              </div>
            </div>

            {programs.length === 0 ? (
              <div className="bg-surface border border-cb-border rounded-lg p-16 text-center">
                <Dumbbell size={40} className="mx-auto text-cb-muted mb-3" />
                <p className="text-cb-muted text-sm">No programs yet. Click &quot;New Program&quot; to get started.</p>
              </div>
            ) : (
              <div className="bg-surface border border-cb-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cb-border bg-surface-light">
                      <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-3">Program</th>
                      <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-3">Client</th>
                      <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-3">Type</th>
                      <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-3">Structure</th>
                      <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-3">Progress</th>
                      <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-3">Status</th>
                      <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-3">Created</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cb-border">
                    {programs.map((program) => (
                      <tr key={program.id} className="hover:bg-surface-light transition-colors">
                        <td className="px-4 py-3">
                          <button onClick={() => openBuilder(program)} className="text-sm font-medium text-cb-teal hover:text-cb-teal/80 text-left">
                            {program.name}
                          </button>
                          {program.description && (
                            <p className="text-xs text-cb-muted mt-0.5 truncate max-w-xs">{program.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {program.client ? (
                            <span className="text-sm text-cb-secondary">{program.client.name ?? program.client.email}</span>
                          ) : (
                            <span className="text-xs text-cb-muted italic">Template</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                            program.ai_generated ? 'bg-cb-teal/10 text-cb-teal' : 'bg-surface-light text-cb-secondary'
                          )}>
                            {program.ai_generated ? 'AI' : 'Fixed'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-cb-secondary">{program.days_per_week}x/wk · {program.weeks} wks</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-surface-light rounded-full overflow-hidden">
                              <div
                                className="h-full bg-cb-teal rounded-full"
                                style={{ width: `${Math.min((program.current_week / program.weeks) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-cb-muted">Wk {program.current_week}/{program.weeks}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {program.is_active ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cb-success/15 text-cb-success">Active</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-light text-cb-muted">Inactive</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-cb-muted whitespace-nowrap">{format(new Date(program.created_at), 'd MMM yyyy')}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => openBuilder(program)} className="text-sm text-cb-teal hover:text-cb-teal/80 font-medium">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          // Builder view
          <div className="flex flex-col h-full overflow-hidden">
            {/* Builder header */}
            <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3 border-b border-cb-border bg-surface">
              <button onClick={closeBuilder} className="text-cb-muted hover:text-cb-secondary">
                <ChevronLeft size={20} />
              </button>
              <input
                type="text"
                value={openProgram.name}
                onChange={(e) => setOpenProgram({ ...openProgram, name: e.target.value })}
                className="flex-1 text-base font-semibold text-cb-text bg-transparent focus:outline-none border-b border-transparent focus:border-cb-teal pb-0.5"
              />
              <button
                onClick={addDay}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-cb-border text-sm text-cb-secondary hover:bg-surface-light rounded-lg transition-colors"
              >
                <Plus size={14} /> Add Workout
              </button>
            </div>

            {/* Day tabs */}
            <div className="flex-shrink-0 flex items-center gap-1 px-4 pt-3 border-b border-cb-border bg-surface overflow-x-auto">
              {builderDays.map((day) => (
                <button
                  key={day.id}
                  onClick={() => setActiveDay(day.id)}
                  className={clsx(
                    'px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                    activeDay === day.id
                      ? 'border-cb-teal text-cb-teal'
                      : 'border-transparent text-cb-secondary hover:text-cb-text'
                  )}
                >
                  {day.name}
                </button>
              ))}
            </div>

            {/* Day exercises */}
            <div className="flex-1 overflow-y-auto p-5">
              {activeDayData ? (
                <div className="space-y-3 max-w-3xl">
                  {/* Day name editor */}
                  <div className="flex items-center gap-3 mb-4">
                    <input
                      type="text"
                      value={activeDayData.name}
                      onChange={(e) => setBuilderDays((prev) => prev.map((d) => d.id === activeDayData.id ? { ...d, name: e.target.value } : d))}
                      className="text-lg font-semibold text-cb-text bg-transparent focus:outline-none border-b border-transparent focus:border-cb-teal pb-0.5 flex-1"
                    />
                    <span className="text-xs text-cb-muted">{activeDayData.exercises.length} exercise{activeDayData.exercises.length !== 1 ? 's' : ''}</span>
                  </div>

                  {activeDayData.exercises.length === 0 && (
                    <div className="bg-surface border border-dashed border-cb-border rounded-lg p-10 text-center">
                      <Dumbbell size={28} className="mx-auto text-cb-muted mb-2" />
                      <p className="text-sm text-cb-muted">Click an exercise in the library to add it here.</p>
                    </div>
                  )}

                  {activeDayData.exercises.map((ex) => (
                    <ExerciseCard
                      key={ex.id}
                      exercise={ex}
                      onUpdate={(updated) => updateExercise(activeDayData.id, ex.id, updated)}
                      onDelete={() => deleteExercise(activeDayData.id, ex.id)}
                      onMoveUp={() => moveExercise(activeDayData.id, ex.id, 'up')}
                      onMoveDown={() => moveExercise(activeDayData.id, ex.id, 'down')}
                    />
                  ))}

                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => addExerciseToDayFromName('New Exercise')}
                      className="flex items-center gap-1.5 text-sm text-brand hover:text-brand/80"
                    >
                      <Plus size={16} /> Add Exercise
                    </button>
                    <span className="text-cb-border">|</span>
                    <button
                      onClick={() => setShowSectionModal(true)}
                      className="flex items-center gap-1.5 text-sm text-cb-secondary hover:text-cb-text"
                    >
                      <LayoutGrid size={15} /> Add Section
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-cb-muted">Select a day to view exercises.</p>
              )}
            </div>

            {/* Builder footer */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-t border-cb-border bg-surface">
              <button onClick={closeBuilder} className="px-4 py-2 text-sm text-cb-secondary border border-cb-border hover:bg-surface-light rounded-lg transition-colors">
                Close
              </button>
              <button className="px-4 py-2 text-sm bg-cb-teal hover:bg-cb-teal/90 text-white rounded-lg font-medium flex items-center gap-2">
                <Save size={14} /> Save Changes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewModal && (
        <NewProgramModal clients={clients} onClose={() => setShowNewModal(false)} onAdd={handleAddProgram} />
      )}
      {showAIModal && (
        <AIWorkoutWizard
          clients={clients}
          onClose={() => setShowAIModal(false)}
          onSave={(prog, days) => {
            const client = clients.find((c) => c.id === prog.client_id)
            const pw: ProgramWithClient = { ...prog, client }
            handleAISave(pw, days)
          }}
        />
      )}
      {showSectionModal && (
        <AddSectionModal onClose={() => setShowSectionModal(false)} onAdd={addSection} />
      )}
      </div>
      )}
    </div>
  )
}
