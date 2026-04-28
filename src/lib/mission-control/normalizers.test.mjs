import assert from 'node:assert/strict';
import {
  normalizeLiveTask,
  buildTaskDecisionItems,
  buildTaskStaleItems,
  buildAuditDecisionItems,
  buildCommitActivityItems,
} from './normalizers.mjs';

const now = new Date('2026-04-28T12:00:00.000Z');

const overdueTask = {
  id: 'task-1',
  title: 'Review Sarah check-in',
  description: 'Energy dropped this week',
  due_date: '2026-04-26',
  completed: false,
  priority: 'high',
  source: 'check_in',
  created_at: '2026-04-20T00:00:00.000Z',
  client: { id: 'client-1', name: 'Sarah', email: 'sarah@example.com' },
};

const doneTask = {
  id: 'task-2',
  title: 'Done task',
  description: null,
  due_date: null,
  completed: true,
  priority: 'medium',
  source: 'manual',
  created_at: '2026-04-27T00:00:00.000Z',
  client: null,
};

const liveTask = normalizeLiveTask(overdueTask);
assert.equal(liveTask.id, 'task-1');
assert.equal(liveTask.status, 'open');
assert.equal(liveTask.origin, 'check_in');
assert.equal(liveTask.source_url, '/tasks');

assert.equal(normalizeLiveTask(doneTask).status, 'done');

const decisions = buildTaskDecisionItems([liveTask], now);
assert.equal(decisions.length, 1);
assert.equal(decisions[0].source, 'supabase_task');
assert.equal(decisions[0].priority, 'high');
assert.equal(decisions[0].review_key, 'supabase_task:task-1');

const stale = buildTaskStaleItems([liveTask], now);
assert.equal(stale.length, 1);
assert.equal(stale[0].reason, 'Overdue since 26 Apr 2026');

const audits = buildAuditDecisionItems([
  {
    id: 'audit-1',
    repo: 'web-dashboard',
    status: 'warnings',
    summary: '3 lint warnings',
    created_at: '2026-04-28T08:00:00.000Z',
    run_url: 'https://github.com/example/run',
  },
  {
    id: 'audit-2',
    repo: 'mobile-app',
    status: 'clean',
    summary: 'All checks passed',
    created_at: '2026-04-28T09:00:00.000Z',
    run_url: null,
  },
]);
assert.equal(audits.length, 1);
assert.equal(audits[0].review_key, 'audit_report:audit-1');

const commitActivity = buildCommitActivityItems([
  {
    id: 'commit-1',
    repo: 'mobile-app',
    commit_sha: 'abcdef123456',
    branch: 'main',
    message: 'Fix onboarding flow',
    files_changed: 4,
    insertions: 20,
    deletions: 5,
    created_at: '2026-04-28T10:00:00.000Z',
    commit_url: 'https://github.com/example/commit/abcdef',
  },
]);
assert.equal(commitActivity[0].id, 'commit-commit-1');
assert.equal(commitActivity[0].summary, '+20 / -5 across 4 files');

console.log('mission-control normalizers ok');
