/**
 * GET /api/ai-coach/mission-control
 *
 * Aggregated snapshot that powers the Mission Control hub page. One endpoint
 * so the hub doesn't water-fall 4–5 separate queries on load.
 *
 * Returns:
 *   • summary        — total / red / amber / green client counts
 *   • openConcerns   — # of open safety concerns
 *   • aiActivity     — this week's AI agent activity (count, tokens, latency)
 *   • timeSaved      — estimated minutes the AI saved the coach this week
 *   • priorityQueue  — top 5 items the coach should act on, ordered by urgency
 *   • pillarHealth   — 5-pillar roster-wide health scores (0–100 each)
 *   • auditFeed      — last 10 AI agent actions (transparent audit trail)
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RawSignalRow {
  client_id: string
  full_name: string | null
  avatar_url: string | null
  days_since_checkin: number | null
  days_since_message: number | null
  avg_energy_last_7d: number | null
  avg_energy_prev_7d: number | null
  avg_stress_last_7d: number | null
  avg_sleep_last_7d:  number | null
  has_active_program: boolean | null
  checkins_last_14d:  number | null
}

type RiskLevel = 'green' | 'amber' | 'red'

interface PriorityItem {
  id: string
  client_id: string
  client_name: string
  headline: string         // 1-line "what needs doing"
  reason: string           // concise supporting context
  action_label: string     // e.g. "Approve deload", "Send check-in reminder"
  action_href: string
  urgency_score: number    // 0–100 — drives sort order
  risk_level: RiskLevel
  estimated_minutes: number
}

interface PillarScore {
  key: 'stimulus' | 'fatigue' | 'adherence' | 'time_horizon' | 'risk'
  label: string
  score: number            // 0–100
  trend: 'up' | 'flat' | 'down'
  hint: string
}

// How long each automated task would have taken the coach manually.
// Used to compute time saved in a transparent way.
const MANUAL_TASK_MINUTES: Record<string, number> = {
  check_in:           8,   // reading + adjusting + writing a reply = ~8m
  message_reply:      3,
  plan_adjustment:   15,
  concern_triage:    10,
  insight:            5,
}

function classifySignals(r: RawSignalRow) {
  const signals: string[] = []
  const daysSince = Number(r.days_since_checkin ?? 999)
  const daysMsg   = Number(r.days_since_message  ?? 999)
  if (daysSince >= 14) signals.push('no_checkin_14d')
  else if (daysSince >= 7) signals.push('no_checkin_7d')
  if (r.avg_energy_last_7d != null && r.avg_energy_prev_7d != null
      && (r.avg_energy_prev_7d - r.avg_energy_last_7d) >= 1.5) signals.push('declining_energy')
  if (r.avg_stress_last_7d != null && r.avg_stress_last_7d >= 7) signals.push('high_stress')
  if (r.avg_sleep_last_7d  != null && r.avg_sleep_last_7d  <= 5) signals.push('poor_sleep')
  if (daysMsg >= 14) signals.push('gone_quiet')
  if (!r.has_active_program) signals.push('no_active_program')
  return signals
}

function riskLevel(signals: string[]): RiskLevel {
  const hasRed = signals.includes('no_checkin_14d')
    || (signals.includes('gone_quiet') && signals.includes('declining_energy'))
    || signals.length >= 2
  if (hasRed) return 'red'
  if (signals.length > 0) return 'amber'
  return 'green'
}

function urgencyScore(signals: string[], risk: RiskLevel): number {
  let s = 0
  if (risk === 'red')   s += 60
  if (risk === 'amber') s += 30
  if (signals.includes('no_checkin_14d'))   s += 25
  if (signals.includes('gone_quiet'))       s += 20
  if (signals.includes('declining_energy')) s += 15
  if (signals.includes('high_stress'))      s += 10
  if (signals.includes('poor_sleep'))       s += 5
  if (signals.includes('no_active_program')) s += 10
  return Math.min(100, s)
}

function headlineFor(name: string, signals: string[]): { headline: string; reason: string; action: string; href: string; estMin: number } {
  if (signals.includes('no_checkin_14d')) {
    return {
      headline: `${name} missed check-ins for 14+ days`,
      reason:   'High churn risk. A gentle reach-out today often converts.',
      action:   'Draft message',
      href:     '/messages',
      estMin:   5,
    }
  }
  if (signals.includes('gone_quiet') && signals.includes('declining_energy')) {
    return {
      headline: `${name} has gone quiet while energy is falling`,
      reason:   'Paired silence + declining energy is the strongest churn predictor in your data.',
      action:   'Call or message',
      href:     '/messages',
      estMin:   6,
    }
  }
  if (signals.includes('high_stress') && signals.includes('poor_sleep')) {
    return {
      headline: `${name} showing high stress + poor sleep`,
      reason:   'Classic overtraining profile. Deload or recovery week recommended.',
      action:   'Approve deload',
      href:     '/intelligence',
      estMin:   2,
    }
  }
  if (signals.includes('declining_energy')) {
    return {
      headline: `${name}'s energy dropped ≥1.5 pts this week`,
      reason:   'Meaningful week-over-week drop. Review volume + sleep before it compounds.',
      action:   'Review program',
      href:     '/intelligence',
      estMin:   4,
    }
  }
  if (signals.includes('no_active_program')) {
    return {
      headline: `${name} has no active program`,
      reason:   'A client without a plan drops off within 10 days on average.',
      action:   'Assign program',
      href:     '/programs',
      estMin:   8,
    }
  }
  if (signals.includes('no_checkin_7d')) {
    return {
      headline: `${name} hasn't checked in this week`,
      reason:   'Send a nudge before the streak breaks.',
      action:   'Send reminder',
      href:     '/check-ins',
      estMin:   2,
    }
  }
  return {
    headline: `${name} needs attention`,
    reason:   signals.length ? `Signals: ${signals.join(', ')}` : 'General review recommended.',
    action:   'Open client',
    href:     '/clients',
    estMin:   4,
  }
}

function buildPillarHealth(rows: RawSignalRow[]): PillarScore[] {
  if (rows.length === 0) {
    // Avoid NaNs on brand new accounts
    return [
      { key: 'stimulus',     label: 'Stimulus',    score: 0, trend: 'flat', hint: 'No training data yet.' },
      { key: 'fatigue',      label: 'Fatigue',     score: 0, trend: 'flat', hint: 'No recovery data yet.' },
      { key: 'adherence',    label: 'Adherence',   score: 0, trend: 'flat', hint: 'No check-ins yet.' },
      { key: 'time_horizon', label: 'Time horizon', score: 0, trend: 'flat', hint: 'No programs assigned.' },
      { key: 'risk',         label: 'Risk',        score: 100, trend: 'flat', hint: 'No risk signals.' },
    ]
  }

  // ADHERENCE — % of roster who checked in in the last 7d
  const checkedInLast7 = rows.filter(r => (r.days_since_checkin ?? 999) <= 7).length
  const adherence = Math.round((checkedInLast7 / rows.length) * 100)

  // FATIGUE — inverted average stress (lower stress = better fatigue score)
  const stressVals = rows.map(r => r.avg_stress_last_7d).filter((v): v is number => v != null)
  const avgStress = stressVals.length ? stressVals.reduce((a, b) => a + b, 0) / stressVals.length : 5
  const fatigue = Math.round(Math.max(0, Math.min(100, (10 - avgStress) * 10)))

  // STIMULUS — % of roster with an active program
  const withProgram = rows.filter(r => r.has_active_program).length
  const stimulus = Math.round((withProgram / rows.length) * 100)

  // TIME_HORIZON — proxy: avg check-ins per client in last 14 days (cap at 4)
  const avgCheckins = rows.reduce((s, r) => s + (r.checkins_last_14d ?? 0), 0) / rows.length
  const timeHorizon = Math.round(Math.min(100, (avgCheckins / 4) * 100))

  // RISK — inverted % of red+amber clients
  const redAmber = rows.filter(r => riskLevel(classifySignals(r)) !== 'green').length
  const risk = Math.round(100 - (redAmber / rows.length) * 100)

  // Trend is left 'flat' here — a richer implementation would diff vs 7d ago.
  const flat: 'flat' = 'flat'
  return [
    { key: 'stimulus',     label: 'Stimulus',     score: stimulus,    trend: flat, hint: `${withProgram}/${rows.length} clients on an active program.` },
    { key: 'fatigue',      label: 'Fatigue',      score: fatigue,     trend: flat, hint: `Roster avg stress ${avgStress.toFixed(1)}/10.` },
    { key: 'adherence',    label: 'Adherence',    score: adherence,   trend: flat, hint: `${checkedInLast7}/${rows.length} checked in this week.` },
    { key: 'time_horizon', label: 'Time horizon', score: timeHorizon, trend: flat, hint: `Avg ${avgCheckins.toFixed(1)} check-ins per client in 14d.` },
    { key: 'risk',         label: 'Risk',         score: risk,        trend: flat, hint: `${redAmber} client${redAmber === 1 ? '' : 's'} at risk or needing attention.` },
  ]
}

export async function GET(_req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Run everything in parallel — this endpoint is load-critical
  const [signalsRes, concernsRes, aiLogsRes] = await Promise.all([
    supabase.rpc('get_client_signals', { p_coach_id: user.id }),
    supabase
      .from('ai_coach_concerns')
      .select('id, severity, status, created_at', { count: 'exact' })
      .eq('status', 'open'),
    supabase
      .from('ai_agent_logs')
      .select('id, trigger_type, output_action, tokens_used, latency_ms, created_at, user_id')
      .gte('created_at', weekAgo)
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  const rows = (signalsRes.data ?? []) as RawSignalRow[]

  // Summary counts
  const summary = { total: rows.length, red: 0, amber: 0, green: 0 }
  const clients = rows.map(r => {
    const signals = classifySignals(r)
    const risk = riskLevel(signals)
    summary[risk] += 1
    return { row: r, signals, risk }
  })

  // Priority queue
  const priorityQueue: PriorityItem[] = clients
    .filter(c => c.risk !== 'green')
    .map(c => {
      const name = c.row.full_name || 'Unknown client'
      const score = urgencyScore(c.signals, c.risk)
      const head = headlineFor(name, c.signals)
      return {
        id: `prio-${c.row.client_id}`,
        client_id: c.row.client_id,
        client_name: name,
        headline: head.headline,
        reason: head.reason,
        action_label: head.action,
        action_href: head.href,
        urgency_score: score,
        risk_level: c.risk,
        estimated_minutes: head.estMin,
      }
    })
    .sort((a, b) => b.urgency_score - a.urgency_score)
    .slice(0, 8)

  // AI activity + time saved
  const logs = aiLogsRes.data ?? []
  const tokensThisWeek = logs.reduce((s, l) => s + (l.tokens_used ?? 0), 0)
  const avgLatencyMs = logs.length ? Math.round(logs.reduce((s, l) => s + (l.latency_ms ?? 0), 0) / logs.length) : 0
  const minutesSaved = logs.reduce((s, l) => s + (MANUAL_TASK_MINUTES[l.trigger_type as string] ?? 5), 0)

  // Audit feed — last 10, with client name resolution
  const recentLogs = logs.slice(0, 10)
  const userIds = Array.from(new Set(recentLogs.map(l => l.user_id).filter(Boolean)))
  const { data: clientProfiles } = userIds.length
    ? await supabase.from('profiles').select('id, name, email').in('id', userIds)
    : { data: [] }
  const profileMap: Record<string, { name: string | null; email: string | null }> = {}
  for (const p of clientProfiles ?? []) profileMap[(p as any).id] = { name: (p as any).name, email: (p as any).email }

  const auditFeed = recentLogs.map(l => ({
    id:            l.id,
    trigger_type:  l.trigger_type,
    output_action: l.output_action,
    created_at:    l.created_at,
    client_name:   profileMap[l.user_id]?.name ?? profileMap[l.user_id]?.email ?? 'Unknown client',
    latency_ms:    l.latency_ms,
    tokens_used:   l.tokens_used,
  }))

  // Pillar health
  const pillarHealth = buildPillarHealth(rows)

  return NextResponse.json({
    summary,
    openConcerns: concernsRes.count ?? 0,
    priorityQueue,
    aiActivity: {
      actionsThisWeek:   logs.length,
      tokensThisWeek,
      avgLatencyMs,
    },
    timeSaved: {
      minutesThisWeek: minutesSaved,
      actionsHandled:  logs.length,
    },
    pillarHealth,
    auditFeed,
  })
}
