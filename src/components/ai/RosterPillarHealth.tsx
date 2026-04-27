'use client'

/**
 * RosterPillarHealth — 5-pillar visualisation of roster-wide health.
 *
 * The mobile app's AI Coach is powered by a 5-pillar decision engine:
 *   1. Stimulus      — are clients actually training?
 *   2. Fatigue       — how recovered is the roster?
 *   3. Adherence     — are they following the plan?
 *   4. Time horizon  — how long until goal dates?
 *   5. Risk          — churn / safety / injury signals
 *
 * This widget shows the coach how their entire roster is doing against each
 * pillar at a glance. Clicking a pillar can eventually filter the priority
 * queue to that lens.
 */

import clsx from 'clsx'
import {
  Dumbbell, BatteryLow, CheckSquare, Clock3, Shield,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react'

export interface PillarScore {
  key: 'stimulus' | 'fatigue' | 'adherence' | 'time_horizon' | 'risk'
  label: string
  score: number        // 0–100
  trend: 'up' | 'flat' | 'down'
  hint: string
}

interface Props {
  pillars: PillarScore[]
  className?: string
}

const ICONS = {
  stimulus:     Dumbbell,
  fatigue:      BatteryLow,
  adherence:    CheckSquare,
  time_horizon: Clock3,
  risk:         Shield,
}

function bucketColor(score: number): { bar: string; text: string; ring: string } {
  if (score >= 80) return { bar: 'bg-emerald-500',  text: 'text-emerald-600 dark:text-emerald-400',  ring: 'stroke-emerald-500' }
  if (score >= 60) return { bar: 'bg-brand',        text: 'text-brand',                               ring: 'stroke-brand' }
  if (score >= 40) return { bar: 'bg-amber-500',    text: 'text-amber-600 dark:text-amber-400',       ring: 'stroke-amber-500' }
  return                  { bar: 'bg-red-500',      text: 'text-red-500',                             ring: 'stroke-red-500' }
}

function Dial({ value, ring }: { value: number; ring: string }) {
  // Simple SVG radial progress — lightweight, no chart library.
  const r = 22, c = 2 * Math.PI * r
  const offset = c - (Math.max(0, Math.min(100, value)) / 100) * c
  return (
    <svg width={56} height={56} viewBox="0 0 56 56" className="flex-shrink-0">
      <circle cx="28" cy="28" r={r} className="stroke-cb-border/50" strokeWidth="4" fill="none" />
      <circle
        cx="28"
        cy="28"
        r={r}
        className={clsx(ring, 'transition-[stroke-dashoffset] duration-700 ease-out')}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        fill="none"
        transform="rotate(-90 28 28)"
      />
    </svg>
  )
}

export default function RosterPillarHealth({ pillars, className }: Props) {
  return (
    <section
      className={clsx(
        'rounded-2xl border border-cb-border bg-surface overflow-hidden animate-fade-in-up',
        className,
      )}
    >
      <header className="flex items-center gap-3 px-5 py-4 border-b border-cb-border">
        <div>
          <h2 className="text-base font-bold text-cb-text leading-none">Roster health · 5 pillars</h2>
          <p className="text-xs text-cb-muted mt-1">
            The same decision engine that powers your clients&apos; daily briefings.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-px bg-cb-border/70 stagger-children">
        {pillars.map((p) => {
          const Icon = ICONS[p.key]
          const c = bucketColor(p.score)
          const TrendIcon = p.trend === 'up' ? TrendingUp : p.trend === 'down' ? TrendingDown : Minus
          return (
            <div
              key={p.key}
              className="group bg-surface p-4 flex flex-col items-center text-center animate-fade-in-up hover:bg-surface-light transition-colors"
              title={p.hint}
            >
              <div className="relative mb-2">
                <Dial value={p.score} ring={c.ring} />
                <Icon
                  size={16}
                  className={clsx('absolute inset-0 m-auto transition-transform group-hover:scale-110', c.text)}
                />
              </div>
              <p className={clsx('font-display text-xl font-bold tabular-nums', c.text)}>{p.score}</p>
              <p className="text-[10px] font-semibold text-cb-muted uppercase tracking-wider mt-0.5">
                {p.label}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-cb-muted mt-1">
                <TrendIcon size={10} className={p.trend === 'up' ? 'text-emerald-500' : p.trend === 'down' ? 'text-red-500' : 'text-cb-muted'} />
                <span>{p.hint}</span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
