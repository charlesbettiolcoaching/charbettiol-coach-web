/**
 * GET /api/ai-coach/briefing
 *
 * Returns a fresh, AI-generated daily briefing for the logged-in coach.
 * The briefing answers "what should I do today?" in 3–5 bullets.
 *
 * Caching: the briefing is computed on every request for now. A future
 * improvement is to cache per-coach per-day in a `coach_briefings` table
 * so we don't pay tokens on every dashboard view.
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

interface BriefingItem {
  priority: 'now' | 'today' | 'this_week'
  headline: string       // ≤ 12 words, action-oriented
  detail: string         // 1 sentence, specific numbers preferred
  action_href: string    // where the coach should go to act
  action_label: string   // e.g. "Open client", "Approve deload"
}

interface Briefing {
  greeting: string
  summary: string        // 1-sentence roster mood
  items: BriefingItem[]
  generated_at: string
  model: string
  from_fallback: boolean // true if Anthropic wasn't configured
}

function fallbackBriefing(context: {
  name: string | null
  total: number
  red: number
  amber: number
  openConcerns: number
  unrepliedMessages: number
}): Briefing {
  const items: BriefingItem[] = []

  if (context.openConcerns > 0) {
    items.push({
      priority: 'now',
      headline: `${context.openConcerns} safety concern${context.openConcerns === 1 ? '' : 's'} need review`,
      detail: 'These were flagged by the AI as potentially sensitive. Review before anything else.',
      action_href: '/concerns',
      action_label: 'Review concerns',
    })
  }
  if (context.red > 0) {
    items.push({
      priority: 'today',
      headline: `${context.red} client${context.red === 1 ? '' : 's'} at churn risk`,
      detail: 'A short personal message from you today will materially reduce drop-off.',
      action_href: '/intelligence',
      action_label: 'See at-risk clients',
    })
  }
  if (context.amber > 0) {
    items.push({
      priority: 'this_week',
      headline: `${context.amber} client${context.amber === 1 ? '' : 's'} showing yellow flags`,
      detail: 'Lower urgency, but a 2-minute nudge protects adherence.',
      action_href: '/intelligence',
      action_label: 'Review flags',
    })
  }
  if (context.unrepliedMessages > 0) {
    items.push({
      priority: 'today',
      headline: `${context.unrepliedMessages} unread message${context.unrepliedMessages === 1 ? '' : 's'}`,
      detail: 'Your average reply time sets client expectations — aim to stay under 6 hours.',
      action_href: '/messages',
      action_label: 'Open inbox',
    })
  }
  if (items.length === 0) {
    items.push({
      priority: 'today',
      headline: 'Your roster is in a good place',
      detail: 'No red flags, no open concerns. A great day to plan next month\'s programming.',
      action_href: '/programs',
      action_label: 'Plan programs',
    })
  }

  const greeting = context.name ? `Good morning, ${context.name}` : 'Good morning'
  const summary = context.total === 0
    ? 'Your roster is empty — add your first client to start getting insights.'
    : `${context.total} client${context.total === 1 ? '' : 's'} on your roster. ${context.red + context.amber} need attention today.`

  return {
    greeting,
    summary,
    items,
    generated_at: new Date().toISOString(),
    model: 'rule-based',
    from_fallback: true,
  }
}

export async function GET(_req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Gather a lightweight context
  const { data: profileData } = await supabase
    .from('profiles').select('full_name, name').eq('id', user.id).single()
  const fullName = ((profileData as any)?.full_name || (profileData as any)?.name || '') as string
  const firstName = fullName.split(' ')[0] || null

  const [signalsRes, concernsRes, messagesRes] = await Promise.all([
    supabase.rpc('get_client_signals', { p_coach_id: user.id }),
    supabase.from('ai_coach_concerns').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('messages').select('id', { count: 'exact', head: true })
      .eq('recipient_id', user.id).is('read_at', null),
  ])

  const rows = (signalsRes.data ?? []) as any[]
  const total = rows.length
  let red = 0, amber = 0
  for (const r of rows) {
    const days = Number(r.days_since_checkin ?? 999)
    const signals: string[] = []
    if (days >= 14) signals.push('no_checkin_14d')
    else if (days >= 7) signals.push('no_checkin_7d')
    if (r.avg_energy_last_7d != null && r.avg_energy_prev_7d != null
      && (r.avg_energy_prev_7d - r.avg_energy_last_7d) >= 1.5) signals.push('declining_energy')
    if (r.avg_stress_last_7d != null && r.avg_stress_last_7d >= 7) signals.push('high_stress')
    if (r.avg_sleep_last_7d  != null && r.avg_sleep_last_7d  <= 5) signals.push('poor_sleep')
    if (Number(r.days_since_message ?? 999) >= 14) signals.push('gone_quiet')
    if (!r.has_active_program) signals.push('no_active_program')
    const isRed = signals.includes('no_checkin_14d')
      || (signals.includes('gone_quiet') && signals.includes('declining_energy'))
      || signals.length >= 2
    if (isRed) red++
    else if (signals.length > 0) amber++
  }

  const openConcerns = concernsRes.count ?? 0
  const unrepliedMessages = messagesRes.count ?? 0

  const ctx = { name: firstName, total, red, amber, openConcerns, unrepliedMessages }

  // No API key → deterministic fallback
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(fallbackBriefing(ctx))
  }

  // Ask Claude to generate the briefing
  const anthropic = new Anthropic()
  const model = 'claude-haiku-4-5-20251001'

  const prompt = `You are a concise coaching assistant embedded in a fitness coach's dashboard. Write a brief morning briefing.

CONTEXT
- Coach: ${firstName ?? 'Coach'}
- Roster size: ${total}
- At-risk (red): ${red}
- Needs attention (amber): ${amber}
- Open safety concerns: ${openConcerns}
- Unread messages: ${unrepliedMessages}

OUTPUT
Respond with valid JSON that matches this TypeScript type exactly:

type Briefing = {
  greeting: string;   // one line, warm but professional, reference the coach by first name if provided
  summary: string;    // one sentence summarising the day — include the total roster size and at-risk count with specific numbers
  items: Array<{
    priority: "now" | "today" | "this_week";
    headline: string;       // ≤ 12 words, action-oriented, specific numbers preferred
    detail: string;         // one sentence of supporting context, cite the data
    action_href: string;    // one of: /concerns, /intelligence, /messages, /check-ins, /ai-reviews, /clients, /programs
    action_label: string;   // e.g. "Review concerns", "See at-risk clients"
  }>;
};

RULES
- Produce between 2 and 5 items total.
- Do NOT fabricate specific client names.
- Open concerns always go first with priority "now".
- Be direct. No hype words. No filler.
- Output JSON only, no prose, no markdown fences.`

  try {
    const msg = await anthropic.messages.create({
      model,
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
    const parsed = JSON.parse(text) as Omit<Briefing, 'generated_at' | 'model' | 'from_fallback'>
    return NextResponse.json({
      ...parsed,
      generated_at: new Date().toISOString(),
      model,
      from_fallback: false,
    })
  } catch (e) {
    // Claude output didn't parse — fall back to deterministic briefing rather than erroring
    return NextResponse.json(fallbackBriefing(ctx))
  }
}
