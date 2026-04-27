'use client'

/**
 * AIAuditFeed — transparent log of every automated AI action.
 *
 * Competitors hide AI behaviour. Propel exposes it. Every entry shows:
 *   • WHAT the AI did (e.g. adjusted a deload, summarised a check-in)
 *   • WHO it affected (client name)
 *   • WHEN it happened
 *   • Token & latency cost (so coaches can verify ROI)
 *
 * Entries are links into the relevant review/concern record so the coach can
 * dig deeper or undo.
 */

import Link from 'next/link'
import clsx from 'clsx'
import { format } from 'date-fns'
import {
  Bot, FileText, MessageSquareText, Sparkles, AlertTriangle, ArrowUpRight,
} from 'lucide-react'

export interface AuditEntry {
  id: string
  trigger_type: string | null
  output_action: string | null
  created_at: string
  client_name: string
  latency_ms: number | null
  tokens_used: number | null
}

interface Props {
  entries: AuditEntry[]
  className?: string
}

const TRIGGER_META: Record<string, { label: string; icon: React.ComponentType<any>; cls: string; href: string }> = {
  check_in:        { label: 'Check-in review',   icon: FileText,            cls: 'text-brand bg-brand/10',       href: '/ai-reviews' },
  message_reply:   { label: 'Message draft',     icon: MessageSquareText,   cls: 'text-blue-500 bg-blue-500/10', href: '/messages' },
  plan_adjustment: { label: 'Plan adjustment',   icon: Sparkles,            cls: 'text-emerald-500 bg-emerald-500/10', href: '/programs' },
  concern_triage:  { label: 'Concern triage',    icon: AlertTriangle,       cls: 'text-red-500 bg-red-500/10',   href: '/concerns' },
  insight:         { label: 'Insight generated', icon: Bot,                 cls: 'text-brand bg-brand/10',       href: '/intelligence' },
  default:         { label: 'AI action',         icon: Bot,                 cls: 'text-slate-500 bg-slate-500/10', href: '/ai-coach' },
}

export default function AIAuditFeed({ entries, className }: Props) {
  return (
    <section
      className={clsx(
        'rounded-2xl border border-cb-border bg-surface overflow-hidden animate-fade-in-up',
        className,
      )}
    >
      <header className="flex items-center gap-3 px-5 py-4 border-b border-cb-border">
        <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
          <Bot size={18} />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-bold text-cb-text leading-none">AI action log</h2>
          <p className="text-xs text-cb-muted mt-1">
            Everything the AI did for you, with full traceability.
          </p>
        </div>
        <Link
          href="/ai-reviews"
          className="text-[11px] font-medium text-brand hover:text-brand-light transition-colors"
        >
          Full audit →
        </Link>
      </header>

      {entries.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-cb-muted">
          The AI hasn&apos;t acted on your behalf yet. As clients submit check-ins,
          actions will appear here with full transparency.
        </div>
      ) : (
        <ul className="divide-y divide-cb-border/60 stagger-children">
          {entries.map(e => {
            const meta = TRIGGER_META[e.trigger_type ?? 'default'] ?? TRIGGER_META.default
            const Icon = meta.icon
            const when = format(new Date(e.created_at), "d MMM · HH:mm")
            return (
              <li key={e.id} className="group px-5 py-3.5 hover:bg-surface-light transition-colors animate-fade-in-up">
                <Link href={meta.href} className="flex items-start gap-3">
                  <span className={clsx('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', meta.cls)}>
                    <Icon size={13} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-cb-text">{meta.label}</span>
                      <span className="text-[11px] text-cb-muted">for {e.client_name}</span>
                    </div>
                    {e.output_action && (
                      <p className="text-xs text-cb-secondary truncate mt-0.5" title={e.output_action}>
                        → {e.output_action}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-cb-muted">
                      <span>{when}</span>
                      {e.latency_ms != null && <span>· {(e.latency_ms / 1000).toFixed(1)}s</span>}
                      {e.tokens_used != null && <span>· {e.tokens_used.toLocaleString()} tok</span>}
                    </div>
                  </div>
                  <ArrowUpRight size={12} className="text-cb-muted group-hover:text-brand transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 flex-shrink-0 mt-1" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
