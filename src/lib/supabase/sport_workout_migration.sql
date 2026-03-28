-- ─── Sport-Specific Workout System Migration ────────────────────────────────
-- Run this in the Supabase SQL editor to add sport/format support.
-- All ALTER TABLE statements are idempotent (safe to run multiple times).

-- 1. Add sport_category and format to workout_days
alter table public.workout_days
  add column if not exists sport_category text not null default 'strength',
  add column if not exists format         text not null default 'straight_sets';

-- 2. Create workout_sections table (blocks within a session)
create table if not exists public.workout_sections (
  id                  uuid         default gen_random_uuid() primary key,
  workout_id          uuid         not null references public.workout_days(id) on delete cascade,
  title               text,
  format              text         not null default 'straight_sets',
  rounds              integer,
  time_limit_seconds  integer,
  work_seconds        integer,
  rest_seconds        integer,
  order_index         integer      not null default 0,
  created_at          timestamptz  not null default now()
);

create index if not exists idx_workout_sections_workout on public.workout_sections(workout_id);

alter table public.workout_sections enable row level security;

create policy "Access workout sections"
  on public.workout_sections for all
  using (
    exists (
      select 1
      from public.workout_days wd
      join public.workout_programs wp on wp.id = wd.program_id
      where wd.id = workout_id
        and (
          wp.coach_id = auth.uid()
          or (wp.client_id = auth.uid() and wp.is_active = true)
        )
    )
  );

-- 3. Add section_id to workout_exercises (optional FK — null = legacy/no section)
alter table public.workout_exercises
  add column if not exists section_id       uuid references public.workout_sections(id) on delete set null,
  add column if not exists duration_seconds integer,
  add column if not exists distance_meters  numeric(10, 2),
  add column if not exists pace             text,
  add column if not exists heart_rate_zone  integer check (heart_rate_zone between 1 and 5),
  add column if not exists calories         integer,
  add column if not exists coach_notes      text;

-- Note: rpe and tempo columns already exist on workout_exercises.
-- Note: reps is text; use string values like "8-12", "AMRAP", etc.
