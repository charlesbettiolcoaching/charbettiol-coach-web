-- Mission Control reviewed live items.
-- Stores Charles/coach decisions for generated live queue items so the
-- command center does not keep resurfacing already-reviewed work.

create table if not exists public.mission_control_reviews (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  review_key text not null,
  source text not null check (source in ('supabase_task', 'audit_report', 'commit_event', 'local_overlay')),
  outcome text not null check (outcome in ('approved', 'vetoed')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coach_id, review_key)
);

alter table public.mission_control_reviews enable row level security;

create policy "coaches_manage_own_mission_control_reviews"
  on public.mission_control_reviews
  for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create index if not exists mission_control_reviews_coach_created_idx
  on public.mission_control_reviews (coach_id, created_at desc);

create index if not exists mission_control_reviews_review_key_idx
  on public.mission_control_reviews (review_key);
