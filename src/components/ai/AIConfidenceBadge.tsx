'use client'

/**
 * AIConfidenceBadge — shows the AI's confidence in a recommendation.
 *
 * Competitors ship AI features as opaque black boxes. Propel's differentiator
 * is transparency: every AI output comes with a confidence score and
 * reasoning. A coach should always know how much to trust any given
 * suggestion before acting on it.
 *
 * Buckets:
 *   • ≥ 85%  "High"      — green, safe to auto-apply
 *   • 60–85% "Moderate"  — amber, worth a quick review
 *   • < 60%  "Low"       — grey, ask a human
 */

import clsx from 'clsx'
import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react'

interface AIConfidenceBadgeProps {
  /** 0–1 (preferred) OR 0–100 — auto-detected. */
  value: number
  className?: string
  /** `compact` hides the label and shows only the icon + percentage. */
  compact?: boolean
  /** Optional short context label (e.g. "for this deload recommendation"). */
  context?: string
}

export default function AIConfidenceBadge({
  value,
  className,
  compact = false,
  context,
}: AIConfidenceBadgeProps) {
  // Accept both 0–1 and 0–100 forms.
  const pct = value <= 1 ? Math.round(value * 100) : Math.round(value)
  const tier = pct >= 85 ? 'high' : pct >= 60 ? 'moderate' : 'low'

  const tiers = {
    high:     { label: 'High confidence',     icon: ShieldCheck,    cls: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' },
    moderate: { label: 'Moderate confidence', icon: ShieldAlert,    cls: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' },
    low:      { label: 'Low confidence',      icon: ShieldQuestion, cls: 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20' },
  } as const

  const { label, icon: Icon, cls } = tiers[tier]

  const title = context
    ? `${label} (${pct}%) ${context}`
    : `${label} — ${pct}%`

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border text-[11px] font-medium leading-none transition-colors',
        compact ? 'px-1.5 py-0.5' : 'px-2 py-1',
        cls,
        className,
      )}
      title={title}
    >
      <Icon size={compact ? 10 : 11} />
      {compact ? (
        <span className="font-semibold tabular-nums">{pct}%</span>
      ) : (
        <>
          <span className="font-semibold tabular-nums">{pct}%</span>
          <span className="opacity-70">· {label.replace(' confidence', '')}</span>
        </>
      )}
    </span>
  )
}
