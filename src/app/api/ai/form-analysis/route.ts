export const dynamic = 'force-dynamic'

import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveTierFeatures } from '@/lib/tier-features'

/**
 * POST /api/ai/form-analysis
 *
 * Elite-only video form analysis using Claude vision on keyframes.
 *
 * The mobile client extracts 3–6 evenly-spaced frames from the recorded
 * video (expo-video-thumbnails) and posts them as base64 data URLs. We
 * feed them to Claude Sonnet 4.6 with a prompt that asks for form-specific
 * cues based on what's visible in the images. This is real visual analysis
 * — not pose estimation, but Claude can read body position, bar path,
 * posture, and depth from the frames.
 *
 * Request body:
 *   {
 *     exerciseName:    string,
 *     userDescription: string (optional — what the user felt happened),
 *     frames: [
 *       { mediaType: 'image/jpeg' | 'image/png', data: '<base64>' },
 *       ...  (2–6 frames)
 *     ]
 *   }
 *
 * Fallback: if `frames` is missing or empty, the endpoint falls back to
 * text-only cues (same as the v1 stub). The UI should warn users in that
 * path that no video was analysed.
 */

interface Frame {
  mediaType: 'image/jpeg' | 'image/png'
  data: string  // base64, no data-URL prefix
}

interface AnalysisRequest {
  exerciseName: string
  userDescription?: string
  frames?: Frame[]
}

const MAX_FRAMES = 6
const MAX_FRAME_BYTES = 1_500_000  // ~1.5 MB per frame after base64 decode
const MAX_TEXT_LEN = 2000

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Tier gate — Elite only.
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .maybeSingle()
  const tf = resolveTierFeatures((profile as any)?.subscription_tier ?? null)
  if (!tf.canAccessVideoFormAnalysis) {
    return NextResponse.json({
      error: 'TIER_LOCKED',
      message: 'Video form analysis is an Elite feature.',
      tier: (profile as any)?.subscription_tier ?? null,
    }, { status: 402 })
  }

  const body = (await req.json().catch(() => ({}))) as AnalysisRequest
  const { exerciseName, userDescription = '', frames = [] } = body

  if (!exerciseName || typeof exerciseName !== 'string' || exerciseName.length > 120) {
    return NextResponse.json({ error: 'exerciseName required (max 120 chars)' }, { status: 400 })
  }
  if (userDescription.length > MAX_TEXT_LEN) {
    return NextResponse.json({ error: `userDescription must be under ${MAX_TEXT_LEN} chars` }, { status: 400 })
  }

  // Validate frames if provided.
  const usableFrames: Frame[] = []
  for (const f of frames.slice(0, MAX_FRAMES)) {
    if (!f || typeof f !== 'object') continue
    if (f.mediaType !== 'image/jpeg' && f.mediaType !== 'image/png') continue
    if (typeof f.data !== 'string' || f.data.length < 64) continue
    // Strip data-URL prefix if client sent one.
    const clean = f.data.startsWith('data:') ? f.data.split(',', 2)[1] ?? '' : f.data
    if (!clean) continue
    // Rough size cap — base64 is ~4/3× raw bytes.
    const estimatedBytes = Math.ceil((clean.length * 3) / 4)
    if (estimatedBytes > MAX_FRAME_BYTES) continue
    usableFrames.push({ mediaType: f.mediaType, data: clean })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 500 })
  }

  const client = new Anthropic()

  const analyzedFrames = usableFrames.length > 0

  const systemPrompt = `You are an elite strength and movement coach reviewing a client's exercise form.

${analyzedFrames
  ? `You are looking at ${usableFrames.length} keyframe${usableFrames.length === 1 ? '' : 's'} pulled from a video of the client performing the exercise. Describe what you actually see in the frames — bar path, joint angles, posture, depth, balance — and connect those observations to specific form cues.`
  : `No video frames were provided, so give evidence-based form cues for the named exercise, personalised to what the client describes having felt. Do NOT claim to have seen anything.`
}

Output format (JSON only, no prose outside):
{
  "summary":             "2-sentence assessment grounded in what's visible / described",
  "topFormCues":         ["cue 1", "cue 2", "cue 3"],
  "commonMistakes":      ["mistake 1", "mistake 2"],
  "redFlags":            ["pain / sharp discomfort / numbness / joint risk — empty array if none"],
  "suggestedAdjustments":["specific programming change, e.g. 'drop top set to 80% RPE for 1 week'"],
  "followUpQuestion":    "one question that would help diagnose further"
}

Constraints:
- If the client mentions pain, sharp discomfort, numbness, joint issues → populate redFlags AND recommend a medical/physio check.
- Cues must be specific to the named exercise; no generic lifting advice.
- ${analyzedFrames ? 'Reference specific frames (e.g. "in frame 2 the bar drifts forward of mid-foot")' : 'Never claim to have "seen" the video — there are no frames.'}
- Max 3 items per list. Be surgical, not exhaustive.`

  const userText = `Exercise: ${exerciseName}
Client description: ${userDescription || '(none provided)'}`

  // Build Anthropic message content — text first, then frames (up to 6).
  type ContentBlock =
    | { type: 'text'; text: string }
    | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  const content: ContentBlock[] = [{ type: 'text', text: userText }]
  for (const f of usableFrames) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: f.mediaType, data: f.data },
    })
  }

  try {
    const completion = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: content as any }],
    })
    const text = completion.content[0]?.type === 'text' ? completion.content[0].text : ''

    let parsed: any = null
    try {
      const match = text.match(/\{[\s\S]*\}/)
      if (match) parsed = JSON.parse(match[0])
    } catch {}

    if (!parsed) {
      return NextResponse.json({ error: 'AI_PARSE_FAILED', raw: text.slice(0, 500) }, { status: 502 })
    }

    return NextResponse.json({
      analysis: parsed,
      exerciseName,
      framesAnalysed: usableFrames.length,
      usedVideo: analyzedFrames,
    })
  } catch (e: any) {
    console.error('[form-analysis] error:', e?.message)
    return NextResponse.json({ error: 'AI request failed', detail: e?.message }, { status: 502 })
  }
}
