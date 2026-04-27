'use client'

/**
 * CommandPalette — the coach's AI-native command surface.
 *
 * Invoked with ⌘K (mac) or Ctrl+K (win). A global keyboard listener
 * installed in DashboardShell.
 *
 * Design goals:
 *   1. Answer "what should I do right now?" in one keystroke.
 *   2. Unify navigation, client search, and AI Q&A into one surface.
 *   3. Feel more like talking to a co-pilot than operating a menu.
 *
 * Behaviour:
 *   • Empty query → shows AI quick actions + recent pages.
 *   • Typed text → fuzzy matches nav pages + clients (loaded on open).
 *   • No matches → offer to "Ask AI" (sends the query to a future /ai-coach/ask).
 *   • Tab or `?` prefix → force "Ask AI" mode.
 *   • Arrow keys navigate, Enter selects, Esc closes.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import clsx from 'clsx'
import {
  Search, Command, ArrowRight, CornerDownLeft, Sparkles,
  User as UserIcon,
} from 'lucide-react'
import AIOrb from './ai/AIOrb'
import { NAV_FLAT, QUICK_ACTIONS, type NavItem, type QuickAction } from '@/lib/nav-catalog'

interface ClientRow {
  id: string
  name: string | null
  email: string | null
}

type Result =
  | { kind: 'action';  item: QuickAction }
  | { kind: 'page';    item: NavItem }
  | { kind: 'client';  item: ClientRow }
  | { kind: 'ask-ai';  query: string }

interface Props {
  open: boolean
  onClose: () => void
}

function matchScore(haystack: string, needle: string): number {
  if (!needle) return 1
  const h = haystack.toLowerCase()
  const n = needle.toLowerCase()
  if (h === n) return 100
  if (h.startsWith(n)) return 80
  if (h.includes(n)) return 60
  // Character-subsequence match (fuzzy)
  let hi = 0
  for (let i = 0; i < n.length; i++) {
    const idx = h.indexOf(n[i], hi)
    if (idx < 0) return 0
    hi = idx + 1
  }
  return 30
}

export default function CommandPalette({ open, onClose }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [clients, setClients] = useState<ClientRow[]>([])
  const [clientsLoaded, setClientsLoaded] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const [askMode, setAskMode] = useState(false)
  const [asking, setAsking] = useState(false)
  const [aiResponse, setAiResponse] = useState<string | null>(null)

  // Focus input + reset state on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
      setAskMode(false)
      setAiResponse(null)
      setAsking(false)
      // next tick so the <input> is mounted
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // Lazy-load clients once, when the palette first opens
  useEffect(() => {
    if (!open || clientsLoaded) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setClientsLoaded(true); return }
      supabase
        .from('profiles')
        .select('id, name, email')
        .eq('coach_id', user.id)
        .eq('role', 'client')
        .limit(200)
        .then(({ data }) => {
          setClients((data as ClientRow[] | null) ?? [])
          setClientsLoaded(true)
        })
    })
  }, [open, clientsLoaded])

  // Build the result list based on current query
  const results: Result[] = useMemo(() => {
    const q = query.trim()

    // In ask-mode, the only result is "Ask AI" (handled in footer)
    if (askMode || q.startsWith('?')) {
      return []
    }

    const list: { r: Result; score: number }[] = []

    if (!q) {
      // Empty query — surface quick actions + top pages
      QUICK_ACTIONS.forEach(a => list.push({ r: { kind: 'action', item: a }, score: 100 }))
      NAV_FLAT.slice(0, 6).forEach(p => list.push({ r: { kind: 'page', item: p }, score: 50 }))
      return list.map(x => x.r)
    }

    // Pages
    for (const p of NAV_FLAT) {
      const labelScore = matchScore(p.label, q)
      const kwScore = (p.keywords ?? []).reduce((m, k) => Math.max(m, matchScore(k, q)), 0)
      const score = Math.max(labelScore, kwScore * 0.85)
      if (score > 0) list.push({ r: { kind: 'page', item: p }, score })
    }

    // Clients
    for (const c of clients) {
      const nameScore = matchScore(c.name ?? '', q)
      const emailScore = matchScore(c.email ?? '', q)
      const score = Math.max(nameScore, emailScore * 0.7)
      if (score > 0) list.push({ r: { kind: 'client', item: c }, score })
    }

    // Quick actions — keywords within the action label
    for (const a of QUICK_ACTIONS) {
      const score = matchScore(a.label, q)
      if (score > 0) list.push({ r: { kind: 'action', item: a }, score: score * 0.9 })
    }

    const top = list.sort((a, b) => b.score - a.score).slice(0, 12).map(x => x.r)
    // Always include Ask AI at the bottom when text present
    top.push({ kind: 'ask-ai', query: q })
    return top
  }, [query, clients, askMode])

  // Keyboard handling
  const selectResult = useCallback(async (r: Result) => {
    if (r.kind === 'action') {
      if (r.item.href) { router.push(r.item.href); onClose() }
      else if (r.item.query) {
        // Switch into AI ask mode with the canned query
        setAskMode(true)
        setQuery(r.item.query)
        runAsk(r.item.query)
      }
    } else if (r.kind === 'page') {
      router.push(r.item.href)
      onClose()
    } else if (r.kind === 'client') {
      router.push(`/clients/${r.item.id}`)
      onClose()
    } else if (r.kind === 'ask-ai') {
      setAskMode(true)
      runAsk(r.query)
    }
  }, [onClose, router])

  const runAsk = useCallback(async (q: string) => {
    setAsking(true)
    setAiResponse(null)
    try {
      const res = await fetch('/api/ai-coach/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      if (!res.ok) throw new Error(`ask failed: ${res.status}`)
      const data = await res.json()
      setAiResponse(data.answer ?? 'The AI did not return an answer.')
    } catch (e) {
      setAiResponse(
        "I can't reach the AI right now. This might mean the ASK endpoint hasn't been configured yet, " +
        'or your connection dropped. Try again in a moment.',
      )
    } finally {
      setAsking(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx(i => Math.min(i + 1, Math.max(0, results.length - 1)))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const r = results[activeIdx]
        if (r) selectResult(r)
      } else if (e.key === 'Tab') {
        e.preventDefault()
        setAskMode(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, results, activeIdx, onClose, selectResult])

  // Keep active item in view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center px-4 pt-[12vh] bg-black/40 backdrop-blur-sm animate-fade-in"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        onMouseDown={e => e.stopPropagation()}
        className="w-full max-w-xl bg-surface/95 border border-cb-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
      >
        {/* Input row */}
        <div className="relative flex items-center gap-3 border-b border-cb-border px-4 py-3">
          {askMode
            ? <AIOrb size="sm" state={asking ? 'thinking' : 'idle'} />
            : <Search size={16} className="text-cb-muted flex-shrink-0" />}
          <input
            ref={inputRef}
            type="text"
            placeholder={askMode
              ? 'Ask the AI about your roster…'
              : 'Jump to… or type ? to ask the AI'}
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setActiveIdx(0)
              // '?' as the very first char switches to ask mode
              if (e.target.value.startsWith('?')) {
                setAskMode(true)
                setQuery(e.target.value.slice(1))
              }
            }}
            className="flex-1 bg-transparent outline-none text-sm text-cb-text placeholder:text-cb-muted"
            autoComplete="off"
            spellCheck={false}
          />
          <div className="flex items-center gap-1 text-[10px] font-medium text-cb-muted">
            {askMode ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-brand/10 text-brand border border-brand/20 px-1.5 py-0.5">
                <Sparkles size={10} /> AI mode
              </span>
            ) : (
              <>
                <kbd className="rounded bg-cb-border/50 px-1.5 py-0.5">Tab</kbd>
                <span>for AI</span>
              </>
            )}
          </div>
        </div>

        {/* Body */}
        <div ref={listRef} className="max-h-[min(60vh,480px)] overflow-y-auto p-2">
          {askMode ? (
            <AIAskView query={query} asking={asking} answer={aiResponse} onRun={() => runAsk(query)} />
          ) : (
            <CommandResultsView
              results={results}
              activeIdx={activeIdx}
              setActiveIdx={setActiveIdx}
              onSelect={selectResult}
              hasQuery={query.length > 0}
            />
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between gap-3 px-4 py-2 border-t border-cb-border bg-surface-light/50 text-[10px] text-cb-muted">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><kbd className="rounded bg-cb-border/60 px-1">↑↓</kbd> nav</span>
            <span className="inline-flex items-center gap-1"><kbd className="rounded bg-cb-border/60 px-1"><CornerDownLeft size={9}/></kbd> select</span>
            <span className="inline-flex items-center gap-1"><kbd className="rounded bg-cb-border/60 px-1">Esc</kbd> close</span>
          </div>
          <div className="flex items-center gap-1">
            <Command size={10} />
            <span>Propel Coach</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Results list ─────────────────────────────────────────────────────────────

function CommandResultsView({
  results, activeIdx, setActiveIdx, onSelect, hasQuery,
}: {
  results: Result[]
  activeIdx: number
  setActiveIdx: (i: number) => void
  onSelect: (r: Result) => void
  hasQuery: boolean
}) {
  if (results.length === 0) {
    return (
      <div className="py-10 text-center text-cb-muted text-sm">
        No matches. Press <kbd className="rounded bg-cb-border/60 px-1 mx-0.5">Tab</kbd> to ask the AI instead.
      </div>
    )
  }

  // Group by kind for visual separation
  const groups = groupByKind(results)

  return (
    <>
      {!hasQuery && groups.action.length > 0 && <SectionLabel>Suggested actions</SectionLabel>}
      {groups.action.map(({ r, idx }) => <ActionRow key={`a${idx}`} r={r as Extract<Result,{kind:'action'}>} idx={idx} active={idx === activeIdx} onHover={setActiveIdx} onSelect={onSelect} />)}

      {groups.page.length > 0 && <SectionLabel>Pages</SectionLabel>}
      {groups.page.map(({ r, idx }) => <PageRow key={`p${idx}`} r={r as Extract<Result,{kind:'page'}>} idx={idx} active={idx === activeIdx} onHover={setActiveIdx} onSelect={onSelect} />)}

      {groups.client.length > 0 && <SectionLabel>Clients</SectionLabel>}
      {groups.client.map(({ r, idx }) => <ClientRowView key={`c${idx}`} r={r as Extract<Result,{kind:'client'}>} idx={idx} active={idx === activeIdx} onHover={setActiveIdx} onSelect={onSelect} />)}

      {groups.ask.length > 0 && <SectionLabel>AI</SectionLabel>}
      {groups.ask.map(({ r, idx }) => <AskRow key={`q${idx}`} r={r as Extract<Result,{kind:'ask-ai'}>} idx={idx} active={idx === activeIdx} onHover={setActiveIdx} onSelect={onSelect} />)}
    </>
  )
}

function groupByKind(results: Result[]) {
  const g = { action: [] as {r: Result, idx: number}[], page: [] as {r: Result, idx: number}[], client: [] as {r: Result, idx: number}[], ask: [] as {r: Result, idx: number}[] }
  results.forEach((r, idx) => {
    if (r.kind === 'action') g.action.push({ r, idx })
    else if (r.kind === 'page') g.page.push({ r, idx })
    else if (r.kind === 'client') g.client.push({ r, idx })
    else g.ask.push({ r, idx })
  })
  return g
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-cb-muted/70">{children}</div>
  )
}

function rowClass(active: boolean) {
  return clsx(
    'flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-colors',
    active ? 'bg-brand/10 text-cb-text' : 'hover:bg-surface-light text-cb-secondary',
  )
}

function ActionRow({ r, idx, active, onHover, onSelect }: { r: Extract<Result,{kind:'action'}>; idx: number; active: boolean; onHover: (i:number)=>void; onSelect: (r: Result)=>void }) {
  const Icon = r.item.icon
  return (
    <div data-idx={idx} className={rowClass(active)} onMouseEnter={() => onHover(idx)} onClick={() => onSelect(r)}>
      <span className="w-7 h-7 rounded-lg bg-brand/10 border border-brand/20 text-brand flex items-center justify-center flex-shrink-0">
        <Icon size={13} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-cb-text truncate">{r.item.label}</p>
        <p className="text-[11px] text-cb-muted truncate">{r.item.hint}</p>
      </div>
      <ArrowRight size={12} className="text-cb-muted" />
    </div>
  )
}

function PageRow({ r, idx, active, onHover, onSelect }: { r: Extract<Result,{kind:'page'}>; idx: number; active: boolean; onHover: (i:number)=>void; onSelect: (r: Result)=>void }) {
  const Icon = r.item.icon
  return (
    <div data-idx={idx} className={rowClass(active)} onMouseEnter={() => onHover(idx)} onClick={() => onSelect(r)}>
      <span className={clsx('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', r.item.ai ? 'bg-brand/10 text-brand border border-brand/20' : 'bg-cb-border/40 text-cb-muted')}>
        <Icon size={13} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-cb-text truncate">{r.item.label}</p>
        <p className="text-[11px] text-cb-muted truncate">{r.item.href}</p>
      </div>
    </div>
  )
}

function ClientRowView({ r, idx, active, onHover, onSelect }: { r: Extract<Result,{kind:'client'}>; idx: number; active: boolean; onHover: (i:number)=>void; onSelect: (r: Result)=>void }) {
  const display = r.item.name || r.item.email || 'Unknown client'
  const initials = (display.split(' ').map(w => w[0]).join('') || '?').slice(0, 2).toUpperCase()
  return (
    <div data-idx={idx} className={rowClass(active)} onMouseEnter={() => onHover(idx)} onClick={() => onSelect(r)}>
      <span className="w-7 h-7 rounded-full bg-brand/10 text-brand border border-brand/20 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
        {initials}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-cb-text truncate">{display}</p>
        <p className="text-[11px] text-cb-muted truncate">{r.item.email ?? ''}</p>
      </div>
      <span className="text-[10px] text-cb-muted">Open client →</span>
    </div>
  )
}

function AskRow({ r, idx, active, onHover, onSelect }: { r: Extract<Result,{kind:'ask-ai'}>; idx: number; active: boolean; onHover: (i:number)=>void; onSelect: (r: Result)=>void }) {
  return (
    <div data-idx={idx} className={rowClass(active)} onMouseEnter={() => onHover(idx)} onClick={() => onSelect(r)}>
      <span className="w-7 h-7 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
        <Sparkles size={13} className="text-brand animate-sparkle" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-cb-text truncate">
          Ask AI: <span className="italic">&ldquo;{r.query}&rdquo;</span>
        </p>
        <p className="text-[11px] text-cb-muted">Natural-language query against your roster data</p>
      </div>
    </div>
  )
}

// ─── AI Ask view ──────────────────────────────────────────────────────────────

function AIAskView({ query, asking, answer, onRun }: { query: string; asking: boolean; answer: string | null; onRun: () => void }) {
  // Auto-run once when there's a query and no answer/request in flight
  useEffect(() => {
    if (query && !asking && answer === null) onRun()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  if (!query) {
    return (
      <div className="p-6 text-center">
        <div className="mx-auto mb-3"><AIOrb size="lg" state="idle" /></div>
        <p className="text-sm font-medium text-cb-text">Type a question about your roster</p>
        <p className="text-xs text-cb-muted mt-1">
          Try &ldquo;who missed their last 2 check-ins?&rdquo; or &ldquo;which clients have gained weight this month?&rdquo;
        </p>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Query echo */}
      <div className="flex items-start gap-2.5 mb-4">
        <UserIcon size={14} className="text-cb-muted mt-1 flex-shrink-0" />
        <p className="text-sm text-cb-text">{query}</p>
      </div>

      {/* Response */}
      <div className="flex items-start gap-2.5">
        <div className="pt-0.5 flex-shrink-0">
          <AIOrb size="sm" state={asking ? 'thinking' : 'idle'} />
        </div>
        <div className="flex-1 min-w-0">
          {asking ? (
            <p className="text-sm text-cb-text leading-relaxed">
              <span className="ai-shimmer-text font-medium">Thinking</span>
              <span className="ai-thinking-dot ml-1" />
              <span className="ai-thinking-dot" />
              <span className="ai-thinking-dot" />
            </p>
          ) : answer ? (
            <p className="text-sm text-cb-text leading-relaxed whitespace-pre-wrap animate-fade-in">
              {answer}
            </p>
          ) : (
            <p className="text-sm text-cb-muted">Press Enter to send this question.</p>
          )}
        </div>
      </div>
    </div>
  )
}
