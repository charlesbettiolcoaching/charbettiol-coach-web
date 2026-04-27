'use client'

/**
 * AIThinkingIndicator — a full-width "AI is working" status bar that pairs
 * the signature AIOrb with a streaming caption.
 *
 * Usage: wherever the AI is generating (reviews, insights, briefings) and
 * the coach is waiting. Replaces the "Loading…" text + spinner pattern.
 *
 *   <AIThinkingIndicator stages={['Reading check-in data', 'Analysing energy & stress trends', 'Drafting recommendation']} />
 *
 * The component cycles through stages every ~2 seconds so the coach always
 * sees a believable sense of progress.
 */

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import AIOrb from './AIOrb'

interface Props {
  /** Sequential stages the AI goes through. Cycles automatically. */
  stages?: string[]
  /** Override the orb size (default `md`). */
  orbSize?: 'sm' | 'md' | 'lg'
  /** Tighter padding when embedded inside a card. */
  dense?: boolean
  className?: string
}

const DEFAULT_STAGES = [
  'Gathering roster signals',
  'Weighting pillars',
  'Drafting recommendations',
]

export default function AIThinkingIndicator({
  stages  = DEFAULT_STAGES,
  orbSize = 'md',
  dense   = false,
  className,
}: Props) {
  const [stageIdx, setStageIdx] = useState(0)

  useEffect(() => {
    if (stages.length <= 1) return
    const id = setInterval(() => {
      setStageIdx(i => (i + 1) % stages.length)
    }, 2200)
    return () => clearInterval(id)
  }, [stages.length])

  return (
    <div
      className={clsx(
        'flex items-center gap-3 rounded-xl border border-brand/15 bg-gradient-to-r from-brand/5 via-surface to-surface animate-fade-in-up',
        dense ? 'px-3 py-2' : 'px-4 py-3',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <AIOrb size={orbSize} state="thinking" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-0.5">AI at work</p>
        <p className="text-sm text-cb-text leading-tight flex items-center gap-1">
          <span className="ai-shimmer-text font-medium">{stages[stageIdx]}</span>
          <span className="inline-flex items-baseline gap-0.5 ml-1">
            <span className="ai-thinking-dot" />
            <span className="ai-thinking-dot" />
            <span className="ai-thinking-dot" />
          </span>
        </p>
      </div>
    </div>
  )
}
