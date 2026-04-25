-- Argus audit reports: daily codebase audit findings from GitHub Actions.
-- Written by CI (service role); read by /api/argus/recent for Mission Control.

create table if not exists public.audit_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  repo text not null,
  commit_sha text,
  commit_branch text,
  status text not null check (status in ('clean','warnings','errors')),
  summary text not null,
  ts_errors int not null default 0,
  lint_errors int not null default 0,
  lint_warnings int not null default 0,
  secrets_found int not null default 0,
  deps_outdated int not null default 0,
  findings jsonb not null default '[]'::jsonb,
  run_url text,
  duration_ms int
);

create index if not exists audit_reports_created_at_idx on public.audit_reports (created_at desc);
create index if not exists audit_reports_repo_created_idx on public.audit_reports (repo, created_at desc);
create index if not exists audit_reports_status_idx on public.audit_reports (status);

alter table public.audit_reports enable row level security;
-- No policies defined: only service_role bypasses RLS. CI writes + server route reads via service key.
