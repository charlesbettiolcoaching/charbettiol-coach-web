/**
 * POST /api/ai-coach/ask
 *
 * Natural-language Q&A about the coach's roster. Powers the Command Palette's
 * "Ask AI" mode (⌘K → type a question → Enter).
 *
 * We DON'T give Claude raw PII. We inject a compact, pre-aggregated roster
 * summary (same signals used by /api/intelligence) plus coach-scoped counts.
 * Claude reasons over that, not raw rows.
 *
 * This is deliberately conservative: it only answers *about the aggregated
 * signals we've pre-computed*. It does not fetch new data or take actions.
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

interface RosterSummaryRow {
  name: string
  risk: 'green' | 'amber' | 'red'
  signals: string[]
  days_since_checkin: number
  days_since_message: number
  energy_trend: 'up' | 'flat' | 'down' | 'unknown'
  has_active_program: boolean
}

function buildRosterSummary(rows: any[]): RosterSummaryRow[] {
  return rows.map(r => {
    const daysCheckin = Number(r.days_since_checkin ?? 999)
    const daysMsg = Number(r.days_since_message ?? 999)
    const signals: string[] = []
    if (daysCheckin >= 14) signals.push('no_checkin_14d')
    else if (daysCheckin >= 7) signals.push('no_checkin_7d')
    if (r.avg_energy_last_7d != null && r.avg_energy_prev_7d != null
        && (r.avg_energy_prev_7d - r.avg_energy_last_7d) >= 1.5) signals.push('declining_energy')
    if (r.avg_stress_last_7d != null && r.avg_stress_last_7d >= 7) signals.push('high_stress')
    if (r.avg_sleep_last_7d  != null && r.avg_sleep_last_7d  <= 5) signals.push('poor_sleep')
    if (daysMsg >= 14) signals.push('gone_quiet')
    if (!r.has_active_program) signals.push('no_active_program')
    const risk: 'green' | 'amber' | 'red' =
      signals.includes('no_checkin_14d')
      || (signals.includes('gone_quiet') && signals.includes('declining_energy'))
      || signals.length >= 2 ? 'red'
      : signals.length > 0 ? 'amber'
      : 'green'
    let trend: 'up' | 'flat' | 'down' | 'unknown' = 'unknown'
    if (r.avg_energy_last_7d != null && r.avg_energy_prev_7d != null) {
      const d = r.avg_energy_last_7d - r.avg_energy_prev_7d
      trend = d > 0.5 ? 'up' : d < -0.5 ? 'down' : 'flat'
    }
    return {
      name:               r.full_name ?? 'Unknown',
      risk,
      signals,
      days_since_checkin: daysCheckin >= 999 ? -1 : daysCheckin,
      days_since_message: daysMsg >= 999 ? -1 : daysMsg,
      energy_trend:       trend,
      has_active_program: Boolean(r.has_active_program),
    }
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const query = typeof body?.query === 'string' ? body.query.trim() : ''
    if (!query) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 })
    }
    if (query.length > 500) {
      return NextResponse.json({ error: 'Query too long' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        answer: "I'm not configured with AI access yet — ask the admin to set ANTHROPIC_API_KEY in the dashboard's environment.",
        confidence: 0,
      })
    }

    const { data: signalRows } = await supabase.rpc('get_client_signals', { p_coach_id: user.id })
    const roster = buildRosterSummary(signalRows ?? [])

    const anthropic = new Anthropic()
    const prompt = `You are Propel Coach, an AI copilot for a fitness coach. You answer questions about the coach's roster using ONLY the structured summary below.

Rules:
- If the question can be answered from the summary, answer concisely with specific numbers and client names.
- If it cannot, say so plainly and suggest what data the coach could add.
- Do not invent clients or metrics. Do not give generic advice.
- Keep responses under 120 words. Use bullet points when listing more than 2 clients.

ROSTER SUMMARY (JSON):
${JSON.stringify(roster, null, 2)}

QUESTION:
${query}

Answer:`

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
    return NextResponse.json({ answer: text, tokens: msg.usage?.output_tokens ?? 0 })
  } catch (e) {
    console.error('[ai-coach/ask] error:', e)
    return NextResponse.json({ error: 'Failed to answer' }, { status: 500 })
  }
}
