const VALID_SOURCES = new Set(['supabase_task', 'audit_report', 'commit_event', 'local_overlay'])
const VALID_OUTCOMES = new Set(['approved', 'vetoed'])

export function validateMissionControlAction(body) {
  const reviewKey = typeof body?.reviewKey === 'string' ? body.reviewKey.trim() : ''
  const source = typeof body?.source === 'string' ? body.source.trim() : ''
  const outcome = typeof body?.outcome === 'string' ? body.outcome.trim() : ''
  const note = typeof body?.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 1000) : null

  if (!reviewKey || reviewKey.length > 180) return { ok: false, error: 'Invalid review key', status: 400 }
  if (!VALID_SOURCES.has(source)) return { ok: false, error: 'Invalid source', status: 400 }
  if (!VALID_OUTCOMES.has(outcome)) return { ok: false, error: 'Invalid outcome', status: 400 }

  return { ok: true, value: { reviewKey, source, outcome, note } }
}

export function extractTaskIdFromReviewKey(reviewKey) {
  const prefix = 'supabase_task:'
  return typeof reviewKey === 'string' && reviewKey.startsWith(prefix)
    ? reviewKey.slice(prefix.length)
    : null
}

export function buildReviewActivityItems(reviews) {
  return reviews.map(review => {
    const source = String(review.source || 'local_overlay')
    const outcome = String(review.outcome || 'approved')
    const label = `${capitalize(outcome)} · ${source.replaceAll('_', ' ')}`

    return {
      id: `review-${review.id || review.review_key}`,
      source: 'mission_control_review',
      title: label,
      summary: String(review.note || review.review_key || ''),
      created_at: review.created_at || new Date(0).toISOString(),
      source_url: source === 'supabase_task' ? '/tasks' : null,
    }
  })
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value
}
