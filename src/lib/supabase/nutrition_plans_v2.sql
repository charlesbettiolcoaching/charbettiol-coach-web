-- ============================================================
-- nutrition_plans_v2
-- Stores rich meal plans as JSONB for fast read/write.
-- Run this in the Supabase SQL Editor.
-- ============================================================

create table if not exists public.nutrition_plans_v2 (
  id            uuid        default gen_random_uuid() primary key,
  coach_id      uuid        references public.profiles(id) on delete cascade not null,
  client_id     uuid        references public.profiles(id) on delete set null,
  name          text        not null,
  status        text        default 'draft'
                            check (status in ('draft', 'published')),
  calories_target integer   not null default 2000,
  protein_target  integer   not null default 150,
  carbs_target    integer   not null default 200,
  fat_target      integer   not null default 65,
  fibre_target    integer   not null default 30,
  days          jsonb       not null default '[]',
  notes         text        default '',
  published_at  timestamptz,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

-- Indexes
create index if not exists idx_nutrition_plans_v2_coach
  on public.nutrition_plans_v2(coach_id);

create index if not exists idx_nutrition_plans_v2_client
  on public.nutrition_plans_v2(client_id);

create index if not exists idx_nutrition_plans_v2_status
  on public.nutrition_plans_v2(client_id, status)
  where status = 'published';

-- Row Level Security
alter table public.nutrition_plans_v2 enable row level security;

-- Coach: full access to their own plans
create policy "Coach manages nutrition plans"
  on public.nutrition_plans_v2
  for all
  using (coach_id = auth.uid());

-- Client: read published plans assigned to them
create policy "Client reads published nutrition plans"
  on public.nutrition_plans_v2
  for select
  using (client_id = auth.uid() and status = 'published');

-- Auto-update updated_at on row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger nutrition_plans_v2_updated_at
  before update on public.nutrition_plans_v2
  for each row execute procedure public.set_updated_at();

-- Enable Supabase Realtime so clients receive live pushes
alter publication supabase_realtime add table public.nutrition_plans_v2;
