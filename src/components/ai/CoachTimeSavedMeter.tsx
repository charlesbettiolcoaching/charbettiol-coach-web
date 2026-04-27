'use client'

/**
 * CoachTimeSavedMeter — a prominent "ROI" widget.
 *
 * Every competitor claims their AI saves time. Propel shows the receipt:
 *
 *   "AI handled 14 tasks for you this week · saved 2h 12m · ≈ $220 at $100/hr"
 *
 * The bar visualizes progress toward a weekly "target" goal so coaches feel
 * the leverage building day by day.
 */

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Clock, Zap } from 'lucide-react'
import AIOrb from './AIOrb'

interface Props {
  /** Minutes saved this week (the API returns this directly). */
  minutesSaved: number
  /** Number of tasks the AI handled. */
  actionsHandled: number
  /** Coach's hourly rate (in dollars). Optional — enables the $ estimate. */
  hourlyRate?: number
  /** Weekly target in minutes (defaults to 300 = 5h). */
  weeklyTargetMinutes?: number
  className?: string
}

function formatHours(mins: number): string {
  if (mins < 1) return '0m'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

export default function CoachTimeSavedMeter({
  minutesSaved,
  actionsHandled,
  hourlyRate,
  weeklyTargetMinutes = 300,
  className,
}: Props) {
  const pct = Math.min(100, Math.round((minutesSaved / weeklyTargetMinutes) * 100))
  const estDollars = hourlyRate ? Math.round((minutesSaved / 60) * hourlyRate) : null

  // Animate the counter on mount — makes the number feel earned
  const [displayMins, setDisplayMins] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const duration = 900
    let raf: number
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
      setDisplayMins(Math.round(minutesSaved * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [minutesSaved])

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/10 via-surface to-surface p-5 animate-fade-in-up',
        className,
      )}
    >
      {/* Decorative AI orb in the top right */}
      <div className="absolute -top-4 -right-4 opacity-70 pointer-events-none">
        <AIOrb size="xl" state="idle" />
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={12} className="text-brand" />
          <p className="text-[10px] font-semibold text-brand uppercase tracking-widest">Coach time saved · this week</p>
        </div>

        <div className="flex items-baseline gap-3 mt-2">
          <span className="font-display text-5xl font-bold text-cb-text tracking-tight tabular-nums">
            {formatHours(displayMins)}
          </span>
          {estDollars != null && (
            <span className="text-xs text-cb-muted">
              ≈ <span className="font-semibold text-cb-text">${estDollars}</span> at ${hourlyRate}/hr
            </span>
          )}
        </div>

        <p className="text-xs text-cb-muted mt-1">
          AI handled <span className="font-semibold text-cb-text">{actionsHandled}</span> task{actionsHandled === 1 ? '' : 's'} on your behalf.
        </p>

        {/* Progress bar toward weekly target */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px] text-cb-muted mb-1.5">
            <span className="uppercase tracking-wider font-semibold">Toward {formatHours(weeklyTargetMinutes)} weekly target</span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <div className="relative h-1.5 rounded-full bg-surface-light overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand to-brand-light transition-[width] duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s linear infinite',
              }}
            />
          </div>
        </div>

        {/* Tiny footer explaining how the number is calculated — transparency */}
        <p className="text-[10px] text-cb-muted/70 mt-3 flex items-center gap-1">
          <Clock size={9} /> Based on avg. time per task type · always revisable.
        </p>
      </div>
    </div>
  )
}
