'use client'

/**
 * /ai-coach — AI Coach Mission Control.
 *
 * The single page that answers "what should I do right now?" for the coach.
 * Pulls from /api/ai-coach/mission-control (aggregated signals) and
 * /api/ai-coach/briefing (AI-generated daily brief).
 *
 * Layout (desktop):
 *   ┌────────────────────────┬──────────────────┐
 *   │ Briefing               │ Time saved       │
 *   │                        ├──────────────────┤
 *   │                        │ Quick launch     │
 *   ├────────────────────────┴──────────────────┤
 *   │ Priority queue                            │
 *   ├───────────────────────────────────────────┤
 *   │ Roster pillar health (5 dials)            │
 *   ├────────────────────────┬──────────────────┤
 *   │ AI audit feed          │ Shortcuts        │
 *   └────────────────────────┴──────────────────┘
 */

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle, ArrowRight, Bot, BrainCircuit, Keyboard, RefreshCw, Sparkles,
} from 'lucide-react'
import { useCommandPalette } from '@/components/CommandPaletteProvider'
import AIOrb from '@/components/ai/AIOrb'
import AIBriefingCard, { type Briefing } from '@/components/ai/AIBriefingCard'
import AIAuditFeed, { type AuditEntry } from '@/components/ai/AIAuditFeed'
import CoachTimeSavedMeter from '@/components/ai/CoachTimeSavedMeter'
import PriorityQueueCard, { type PriorityItem } from '@/components/ai/PriorityQueueCard'
import RosterPillarHealth, { type PillarScore } from '@/components/ai/RosterPillarHealth'
import clsx from 'clsx'

interface MissionControlData {
  summary: { total: number; red: number; amber: number; green: number }
  openConcerns: number
  priorityQueue: PriorityItem[]
  aiActivity: { actionsThisWeek: number; tokensThisWeek: number; avgLatencyMs: number }
  timeSaved: { minutesThisWeek: number; actionsHandled: number }
  pillarHealth: PillarScore[]
  auditFeed: AuditEntry[]
}

export default function AICoachMissionControl() {
  const palette = useCommandPalette()
  const [mc, setMc] = useState<MissionControlData | null>(null)
  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [loadingMc, setLoadingMc] = useState(true)
  const [loadingBriefing, setLoadingBriefing] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoadingMc(true)
    setLoadingBriefing(true)
    const [mcRes, briefRes] = await Promise.allSettled([
      fetch('/api/ai-coach/mission-control').then(r => r.ok ? r.json() : null),
      fetch('/api/ai-coach/briefing').then(r => r.ok ? r.json() : null),
    ])
    if (mcRes.status === 'fulfilled' && mcRes.value) setMc(mcRes.value)
    if (briefRes.status === 'fulfilled' && briefRes.value) setBriefing(briefRes.value)
    setLoadingMc(false)
    setLoadingBriefing(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const refreshBriefing = useCallback(async () => {
    setLoadingBriefing(true)
    const res = await fetch('/api/ai-coach/briefing').then(r => r.ok ? r.json() : null)
    if (res) setBriefing(res)
    setLoadingBriefing(false)
  }, [])

  const refreshAll = useCallback(async () => {
    setRefreshing(true)
    await fetchAll()
    setRefreshing(false)
  }, [fetchAll])

  const timeOfDay = new Date().getHours()
  const heroHeadline =
    timeOfDay < 5   ? 'Still up? Let\'s make it count.'
    : timeOfDay < 12 ? 'Good morning. Here\'s your roster.'
    : timeOfDay < 17 ? 'Good afternoon. Here\'s where to focus.'
    : timeOfDay < 21 ? 'Good evening. One more pass before you log off?'
    :                   'Late-night check. Still in control.'

  return (
    <div className="relative max-w-6xl mx-auto p-6 lg:p-8 space-y-6">
      {/* Ambient gradient — subtle glow behind the orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -left-10 w-[320px] h-[320px] rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--brand-light) 0%, transparent 70%)' }}
      />

      {/* Hero header */}
      <header className="relative flex items-start justify-between gap-6 animate-fade-in-down">
        <div className="flex items-start gap-4">
          <AIOrb size="xl" state="idle" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 text-[10px] font-bold uppercase tracking-widest">
                <Sparkles size={10} className="animate-sparkle" />
                AI Coach
              </span>
              <span className="text-[10px] font-medium text-cb-muted uppercase tracking-widest">
                Mission Control
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold text-cb-text tracking-tight">
              {heroHeadline}
            </h1>
            <p className="text-sm text-cb-muted mt-1 max-w-xl">
              One page that answers <span className="italic">&ldquo;what should I do right now?&rdquo;</span> Every widget here is driven by real signals — no vanity metrics.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => palette.setOpen(true)}
            className="hidden md:inline-flex items-center gap-2 px-3 py-2 border border-cb-border text-cb-secondary rounded-lg hover:border-brand/40 hover:text-brand transition-all text-sm font-medium press"
          >
            <Keyboard size={14} />
            Ask AI
            <kbd className="text-[10px] bg-surface-light border border-cb-border rounded px-1 ml-1">⌘K</kbd>
          </button>
          <button
            onClick={refreshAll}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-2 border border-brand text-brand rounded-lg hover:bg-brand/5 transition-all text-sm font-medium press disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </header>

      {/* Row 1: Briefing + Time Saved + Quick stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <AIBriefingCard
          briefing={briefing}
          loading={loadingBriefing}
          className="lg:col-span-2"
          onRegenerate={refreshBriefing}
        />
        <div className="space-y-5">
          <CoachTimeSavedMeter
            minutesSaved={mc?.timeSaved.minutesThisWeek ?? 0}
            actionsHandled={mc?.timeSaved.actionsHandled ?? 0}
            hourlyRate={100}
          />
          <QuickStatStack
            openConcerns={mc?.openConcerns ?? 0}
            redCount={mc?.summary.red ?? 0}
            amberCount={mc?.summary.amber ?? 0}
            loading={loadingMc}
          />
        </div>
      </div>

      {/* Row 2: Priority queue */}
      <PriorityQueueCard items={mc?.priorityQueue ?? []} />

      {/* Row 3: Pillar health */}
      <RosterPillarHealth pillars={mc?.pillarHealth ?? defaultPillars()} />

      {/* Row 4: Audit feed + Jump tiles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <AIAuditFeed entries={mc?.auditFeed ?? []} className="lg:col-span-2" />
        <JumpTiles />
      </div>

      {/* Footer: trust */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-cb-muted pt-4 animate-fade-in">
        <Bot size={11} className="text-brand" />
        <span>
          The AI is a co-pilot. You stay in control — every action is optional, every decision is transparent.
        </span>
      </div>
    </div>
  )
}

// ─── Sub-widgets ──────────────────────────────────────────────────────────────

function QuickStatStack({
  openConcerns, redCount, amberCount, loading,
}: {
  openConcerns: number; redCount: number; amberCount: number; loading: boolean
}) {
  const items = [
    {
      label: 'Open safety concerns',
      value: openConcerns,
      href: '/concerns',
      icon: AlertTriangle,
      tone: openConcerns > 0 ? 'urgent' : 'ok',
      hint: openConcerns > 0 ? 'Action required' : 'All clear',
    },
    {
      label: 'At churn risk',
      value: redCount,
      href: '/intelligence',
      icon: BrainCircuit,
      tone: redCount > 0 ? 'urgent' : 'ok',
      hint: redCount > 0 ? `${redCount + amberCount} total need attention` : `${amberCount} on watch`,
    },
  ] as const

  return (
    <div className="space-y-3 stagger-children">
      {items.map((s) => {
        const Icon = s.icon
        const urgent = s.tone === 'urgent'
        return (
          <Link
            key={s.label}
            href={s.href}
            className={clsx(
              'group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all card-lift press animate-fade-in-up',
              urgent
                ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                : 'bg-surface border-cb-border hover:border-brand/30',
            )}
          >
            <div className={clsx(
              'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
              urgent ? 'bg-red-500/10 text-red-500' : 'bg-brand/10 text-brand',
            )}>
              <Icon size={16} className={urgent ? 'animate-breathe' : undefined} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-cb-muted uppercase tracking-wider">{s.label}</p>
              <div className="flex items-baseline gap-2">
                <p className={clsx('font-display text-2xl font-bold tabular-nums', urgent ? 'text-red-500' : 'text-cb-text')}>
                  {loading ? '—' : s.value}
                </p>
                <p className="text-[11px] text-cb-muted">{s.hint}</p>
              </div>
            </div>
            <ArrowRight size={14} className="text-cb-muted group-hover:text-brand transition-transform group-hover:translate-x-0.5" />
          </Link>
        )
      })}
    </div>
  )
}

function JumpTiles() {
  const tiles = [
    { href: '/ai-reviews',   label: 'AI Reviews',   desc: 'Audit every check-in the AI adjusted', icon: Bot },
    { href: '/intelligence', label: 'Intelligence', desc: 'Churn + wellbeing signals',            icon: BrainCircuit },
    { href: '/concerns',     label: 'Concerns',     desc: 'Flagged safety escalations',           icon: AlertTriangle },
  ]
  return (
    <div className="space-y-3 stagger-children">
      {tiles.map(t => {
        const Icon = t.icon
        return (
          <Link
            key={t.href}
            href={t.href}
            className="group flex items-center gap-3 p-4 rounded-xl border border-cb-border bg-surface hover:border-brand/30 transition-all card-lift press animate-fade-in-up"
          >
            <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
              <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-cb-text group-hover:text-brand transition-colors">{t.label}</p>
              <p className="text-[11px] text-cb-muted">{t.desc}</p>
            </div>
            <ArrowRight size={13} className="text-cb-muted group-hover:text-brand transition-transform group-hover:translate-x-0.5" />
          </Link>
        )
      })}
    </div>
  )
}

function defaultPillars(): PillarScore[] {
  return [
    { key: 'stimulus',     label: 'Stimulus',     score: 0, trend: 'flat', hint: 'Loading…' },
    { key: 'fatigue',      label: 'Fatigue',      score: 0, trend: 'flat', hint: 'Loading…' },
    { key: 'adherence',    label: 'Adherence',    score: 0, trend: 'flat', hint: 'Loading…' },
    { key: 'time_horizon', label: 'Time horizon', score: 0, trend: 'flat', hint: 'Loading…' },
    { key: 'risk',         label: 'Risk',         score: 0, trend: 'flat', hint: 'Loading…' },
  ]
}
