import assert from 'node:assert/strict'
import {
  buildReviewActivityItems,
  extractTaskIdFromReviewKey,
  validateMissionControlAction,
} from './actions.mjs'

{
  const action = validateMissionControlAction({
    reviewKey: ' supabase_task:task-123 ',
    source: 'supabase_task',
    outcome: 'approved',
    note: 'Looks good',
  })

  assert.equal(action.ok, true)
  assert.equal(action.value.reviewKey, 'supabase_task:task-123')
  assert.equal(action.value.source, 'supabase_task')
  assert.equal(action.value.outcome, 'approved')
  assert.equal(action.value.note, 'Looks good')
}

{
  const action = validateMissionControlAction({
    reviewKey: 'x'.repeat(181),
    source: 'supabase_task',
    outcome: 'approved',
  })

  assert.equal(action.ok, false)
  assert.equal(action.error, 'Invalid review key')
}

{
  const action = validateMissionControlAction({
    reviewKey: 'audit_report:abc',
    source: 'unknown',
    outcome: 'approved',
  })

  assert.equal(action.ok, false)
  assert.equal(action.error, 'Invalid source')
}

{
  const action = validateMissionControlAction({
    reviewKey: 'audit_report:abc',
    source: 'audit_report',
    outcome: 'ignored',
  })

  assert.equal(action.ok, false)
  assert.equal(action.error, 'Invalid outcome')
}

{
  assert.equal(extractTaskIdFromReviewKey('supabase_task:task-123'), 'task-123')
  assert.equal(extractTaskIdFromReviewKey('audit_report:task-123'), null)
}

{
  const activity = buildReviewActivityItems([
    {
      id: 'review-1',
      review_key: 'supabase_task:task-123',
      source: 'supabase_task',
      outcome: 'approved',
      note: null,
      created_at: '2026-04-28T10:00:00.000Z',
    },
    {
      id: 'review-2',
      review_key: 'audit_report:audit-123',
      source: 'audit_report',
      outcome: 'vetoed',
      note: 'Already handled in PR',
      created_at: '2026-04-28T11:00:00.000Z',
    },
  ])

  assert.equal(activity.length, 2)
  assert.equal(activity[0].id, 'review-review-1')
  assert.equal(activity[0].source, 'mission_control_review')
  assert.equal(activity[0].title, 'Approved · supabase task')
  assert.equal(activity[0].summary, 'supabase_task:task-123')
  assert.equal(activity[1].title, 'Vetoed · audit report')
  assert.equal(activity[1].summary, 'Already handled in PR')
}

console.log('mission-control actions ok')
