'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, ChevronDown, X, Sparkles } from 'lucide-react'
import clsx from 'clsx'

const STORAGE_KEY = 'coach_getting_started_v1'

interface Step {
  id: string
  label: string
  description: string
  href: string
  cta: string
}

const STEPS: Step[] = [
  {
    id: 'add_client',
    label: 'Add your first client',
    description: 'Set up a client profile with their goals and details.',
    href: '/clients',
    cta: 'Add Client',
  },
  {
    id: 'create_program',
    label: 'Create a workout program',
    description: 'Build a week-by-week training plan for a client.',
    href: '/training',
    cta: 'Build Program',
  },
  {
    id: 'create_meal_plan',
    label: 'Publish a meal plan',
    description: 'Design and publish a nutrition plan.',
    href: '/nutrition',
    cta: 'Create Plan',
  },
  {
    id: 'complete_profile',
    label: 'Complete your profile',
    description: 'Add your coaching bio and contact details.',
    href: '/settings',
    cta: 'Go to Settings',
  },
]

function loadState(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveState(s: Record<string, boolean>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

export default function GettingStartedChecklist() {
  const router = useRouter()
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [collapsed, setCollapsed] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const s = loadState()
    setChecked(s)
    setDismissed(s.__dismissed === true)
    setMounted(true)
  }, [])

  if (!mounted || dismissed) return null

  const completedCount = STEPS.filter((s) => checked[s.id]).length
  const allDone = completedCount === STEPS.length

  if (allDone) return null

  function toggle(id: string) {
    const next = { ...checked, [id]: !checked[id] }
    setChecked(next)
    saveState(next)
  }

  function dismiss() {
    const next = { ...checked, __dismissed: true }
    setChecked(next)
    saveState(next)
    setDismissed(true)
  }

  const pct = Math.round((completedCount / STEPS.length) * 100)

  return (
    <div className="fixed bottom-6 right-6 z-30 w-80 bg-surface border border-cb-border rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cb-border bg-surface-light">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          <Sparkles size={14} className="text-brand flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-cb-text">Getting Started</p>
            <p className="text-[10px] text-cb-muted">{completedCount} of {STEPS.length} complete</p>
          </div>
          <ChevronDown
            size={14}
            className={clsx('text-cb-muted transition-transform', collapsed && 'rotate-180')}
          />
        </button>
        <button
          onClick={dismiss}
          className="ml-2 p-1 text-cb-muted hover:text-cb-secondary rounded transition-colors"
          title="Dismiss"
        >
          <X size={13} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-cb-border">
        <div
          className="h-1 bg-brand transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps */}
      {!collapsed && (
        <div className="py-2">
          {STEPS.map((step) => {
            const done = checked[step.id] ?? false
            return (
              <div
                key={step.id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-surface-light transition-colors group"
              >
                <button
                  onClick={() => toggle(step.id)}
                  className="mt-0.5 flex-shrink-0 text-cb-muted hover:text-brand transition-colors"
                >
                  {done
                    ? <CheckCircle2 size={16} className="text-brand" />
                    : <Circle size={16} />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <p className={clsx('text-xs font-medium', done ? 'text-cb-muted line-through' : 'text-cb-text')}>
                    {step.label}
                  </p>
                  {!done && (
                    <p className="text-[11px] text-cb-muted mt-0.5 leading-relaxed">{step.description}</p>
                  )}
                </div>
                {!done && (
                  <button
                    onClick={() => router.push(step.href)}
                    className="flex-shrink-0 text-[10px] font-medium text-brand hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {step.cta} →
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
