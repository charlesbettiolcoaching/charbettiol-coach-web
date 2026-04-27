'use client'

/**
 * PriorityQueueCard — the single most important widget on Mission Control.
 *
 * Shows the top N things the coach should do RIGHT NOW, ordered by urgency.
 * Each row is one decision + one action. Total time estimate sits in the
 * header so the coach can say "I have 15 minutes, let me knock out the top 3".
 */

import clsx from 'clsx'
import Link from 'next/link'
import {
  AlertTriangle, ArrowRight, Clock, ListChecks, Sparkles,
} from 'lucide-react'
import AIConfidenceBadge from './AIConfidenceBadge'

export interface PriorityItem {
  id: string
  client_id: string
  client_name: string
  headline: string
  reason: string
  action_label: string
  action_href: string
  urgency_score: number       // 0–100
  risk_level: 'red' | 'amber' | 'green'
  estimated_minutes: number
}

interface Props {
  items: PriorityItem[]
  className?: string
}

const RISK: Record<'red' | 'amber' | 'green', { dot: string; label: string; chip: string }> = {
  red:   { dot: 'bg-red-500',    label: 'Critical',        chip: 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400' },
  amber: { dot: 'bg-amber-400',  label: 'Watch',           chip: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400' },
  green: { dot: 'bg-emerald-500', label: 'Opportunity',    chip: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400' },
}

export default function PriorityQueueCard({ items, className }: Props) {
  const totalMin = items.reduce((s, i) => s + i.estimated_minutes, 0)
  const hasCritical = items.some(i => i.risk_level === 'red')

  return (
    <section
      className={clsx(
        'rounded-2xl border border-cb-border bg-surface overflow-hidden animate-fade-in-up',
        className,
      )}
    >
      <header className="flex items-center gap-3 px-5 py-4 border-b border-cb-border">
        <div className={clsx(
          'w-9 h-9 rounded-xl flex items-center justify-center',
          hasCritical ? 'bg-red-500/10 text-red-500' : 'bg-brand/10 text-brand',
        )}>
          <ListChecks size={18} />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-bold text-cb-text leading-none">Priority queue</h2>
          <p className="text-xs text-cb-muted mt-1">
            {items.length === 0
              ? 'Nothing urgent. Breathe — or plan next month.'
              : `${items.length} decision${items.length === 1 ? '' : 's'} · ~${totalMin} min to clear`}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand bg-brand/10 border border-brand/20 rounded-full px-2 py-1">
          <Sparkles size={11} className="animate-sparkle" />
          AI-ordered
        </span>
      </header>

      {items.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <div className="inline-block animate-float mb-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
              <ListChecks size={26} className="text-emerald-500" />
            </div>
          </div>
          <p className="font-semibold text-cb-text">No urgent actions</p>
          <p className="text-xs text-cb-muted mt-1 max-w-sm mx-auto">
            Your roster is in good shape right now. Great moment to build next month&apos;s programming.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-cb-border stagger-children">
          {items.map((item) => {
            const risk = RISK[item.risk_level]
            // Simple confidence heuristic derived from urgency score:
            // urgency ≥ 75 -> very high confidence; 50-75 -> moderate; else low
            const confidence = item.urgency_score >= 75 ? 0.9
                              : item.urgency_score >= 50 ? 0.72
                              : 0.55

            return (
              <li
                key={item.id}
                className="group flex items-start gap-4 px-5 py-4 hover:bg-surface-light transition-colors animate-fade-in-up"
              >
                <span
                  className={clsx('mt-2 w-2 h-2 rounded-full flex-shrink-0', risk.dot)}
                  aria-hidden
                />

                <div className="flex-1 min-w-0">
                  {/* Headline + meta chips */}
                  <div className="flex items-start gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-cb-text leading-snug">
                      {item.headline}
                    </p>
                    <span className={clsx(
                      'inline-flex items-center text-[10px] font-semibold rounded-full border px-1.5 py-0.5 leading-none',
                      risk.chip,
                    )}>
                      {risk.label}
                    </span>
                  </div>

                  <p className="text-xs text-cb-secondary mt-1 leading-relaxed">
                    {item.reason}
                  </p>

                  <div className="flex items-center gap-3 mt-2">
                    <AIConfidenceBadge value={confidence} compact />
                    <span className="inline-flex items-center gap-1 text-[11px] text-cb-muted">
                      <Clock size={10} />
                      ~{item.estimated_minutes} min
                    </span>
                    {item.risk_level === 'red' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-500">
                        <AlertTriangle size={10} />
                        Act today
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href={`/clients/${item.client_id}`}
                  className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand-light transition-colors press rounded-md px-2 py-1 border border-brand/20 bg-brand/5 group-hover:bg-brand/10"
                >
                  {item.action_label}
                  <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
