-- ============================================================
-- workout_v2 schema
-- Complete exercise library, program builder, workout logging,
-- personal bests, and reusable templates.
-- Run in Supabase SQL Editor.
-- Depends on: public.profiles, public.set_updated_at() trigger fn
-- ============================================================

-- ── 1. Exercises (master library) ────────────────────────────

create table if not exists public.exercises (
  id             uuid         default gen_random_uuid() primary key,
  name           text         not null,
  muscle_groups  text[]       not null default '{}',
  category       text         not null
                              check (category in ('push','pull','legs','core','cardio','full_body')),
  equipment      text[]       not null default '{}',
  movement_type  text         not null
                              check (movement_type in ('compound','isolation','cardio')),
  demo_video_url text,
  demo_image_url text,
  instructions   text,
  created_by     uuid         references public.profiles(id) on delete set null,
  is_system      boolean      not null default false,
  created_at     timestamptz  not null default now()
);

create index if not exists idx_exercises_category   on public.exercises(category);
create index if not exists idx_exercises_created_by on public.exercises(created_by);
create index if not exists idx_exercises_name       on public.exercises using gin(to_tsvector('english', name));

alter table public.exercises enable row level security;

-- All authenticated users can browse the library
create policy "Authenticated users read exercises"
  on public.exercises for select
  using (auth.uid() is not null);

-- Coaches create their own exercises
create policy "Coach creates exercises"
  on public.exercises for insert
  with check (created_by = auth.uid() and is_system = false);

-- Coaches can only update/delete their own (non-system) exercises
create policy "Coach updates own exercises"
  on public.exercises for update
  using (created_by = auth.uid() and is_system = false);

create policy "Coach deletes own exercises"
  on public.exercises for delete
  using (created_by = auth.uid() and is_system = false);

-- ── 2. Programs ──────────────────────────────────────────────

create table if not exists public.programs (
  id             uuid         default gen_random_uuid() primary key,
  coach_id       uuid         not null references public.profiles(id) on delete cascade,
  client_id      uuid         references public.profiles(id) on delete set null,
  -- populated when instantiated from a template
  template_id    uuid,
  name           text         not null,
  description    text,
  duration_weeks integer      not null default 4 check (duration_weeks >= 1),
  days_per_week  integer      not null default 3 check (days_per_week between 1 and 7),
  goal           text         not null default 'general_fitness'
                              check (goal in ('strength','hypertrophy','fat_loss','endurance','general_fitness')),
  difficulty     text         not null default 'intermediate'
                              check (difficulty in ('beginner','intermediate','advanced')),
  status         text         not null default 'draft'
                              check (status in ('draft','active','completed')),
  started_at     timestamptz,
  completed_at   timestamptz,
  notes          text,
  created_at     timestamptz  not null default now(),
  updated_at     timestamptz  not null default now()
);

create index if not exists idx_programs_coach  on public.programs(coach_id);
create index if not exists idx_programs_client on public.programs(client_id);
create index if not exists idx_programs_active on public.programs(client_id, status)
  where status = 'active';

alter table public.programs enable row level security;

create policy "Coach manages programs"
  on public.programs for all
  using (coach_id = auth.uid());

create policy "Client reads assigned programs"
  on public.programs for select
  using (client_id = auth.uid() and status in ('active','completed'));

create trigger programs_updated_at
  before update on public.programs
  for each row execute procedure public.set_updated_at();

-- ── 3. Program Workouts (individual sessions) ────────────────

create table if not exists public.program_workouts (
  id          uuid         default gen_random_uuid() primary key,
  program_id  uuid         not null references public.programs(id) on delete cascade,
  week_number integer      not null default 1 check (week_number >= 1),
  day_number  integer      not null check (day_number between 1 and 7),
  name        text         not null,  -- e.g. "Day 1 – Upper Body Push"
  notes       text,
  created_at  timestamptz  not null default now()
);

create index if not exists idx_program_workouts_program on public.program_workouts(program_id);

alter table public.program_workouts enable row level security;

create policy "Access program workouts"
  on public.program_workouts for all
  using (
    exists (
      select 1 from public.programs p
      where p.id = program_id
        and (
          p.coach_id = auth.uid()
          or (p.client_id = auth.uid() and p.status in ('active','completed'))
        )
    )
  );

-- ── 4. Supersets ─────────────────────────────────────────────

create table if not exists public.supersets (
  id          uuid         default gen_random_uuid() primary key,
  workout_id  uuid         not null references public.program_workouts(id) on delete cascade,
  label       text,  -- e.g. "Superset A", "Circuit 1"
  created_at  timestamptz  not null default now()
);

alter table public.supersets enable row level security;

create policy "Access supersets"
  on public.supersets for all
  using (
    exists (
      select 1 from public.program_workouts pw
      join public.programs p on p.id = pw.program_id
      where pw.id = workout_id
        and (
          p.coach_id = auth.uid()
          or (p.client_id = auth.uid() and p.status in ('active','completed'))
        )
    )
  );

-- ── 5. Program Workout Exercises ─────────────────────────────

create table if not exists public.program_workout_exercises (
  id           uuid          default gen_random_uuid() primary key,
  workout_id   uuid          not null references public.program_workouts(id) on delete cascade,
  exercise_id  uuid          not null references public.exercises(id),
  superset_id  uuid          references public.supersets(id) on delete set null,
  order_index  integer       not null default 0,
  sets         integer       not null default 3 check (sets >= 1),
  reps_min     integer       not null default 8 check (reps_min >= 1),
  reps_max     integer       not null default 12,
  -- null = bodyweight / AMRAP
  weight       numeric(7,2),
  weight_unit  text          not null default 'kg' check (weight_unit in ('kg','lb')),
  rest_seconds integer       not null default 90,
  -- Rate of Perceived Exertion target, 1–10
  rpe          numeric(3,1)  check (rpe between 1 and 10),
  -- eccentric-pause-concentric-pause, e.g. "3-1-2-0"
  tempo        text,
  notes        text,
  created_at   timestamptz   not null default now(),
  constraint reps_range_valid check (reps_max >= reps_min)
);

create index if not exists idx_pwe_workout  on public.program_workout_exercises(workout_id);
create index if not exists idx_pwe_exercise on public.program_workout_exercises(exercise_id);

alter table public.program_workout_exercises enable row level security;

create policy "Access program workout exercises"
  on public.program_workout_exercises for all
  using (
    exists (
      select 1 from public.program_workouts pw
      join public.programs p on p.id = pw.program_id
      where pw.id = workout_id
        and (
          p.coach_id = auth.uid()
          or (p.client_id = auth.uid() and p.status in ('active','completed'))
        )
    )
  );

-- ── 6. Program Templates ─────────────────────────────────────

create table if not exists public.program_templates (
  id             uuid         default gen_random_uuid() primary key,
  coach_id       uuid         not null references public.profiles(id) on delete cascade,
  name           text         not null,
  description    text,
  duration_weeks integer      not null default 4,
  days_per_week  integer      not null default 3,
  goal           text         not null default 'general_fitness'
                              check (goal in ('strength','hypertrophy','fat_loss','endurance','general_fitness')),
  difficulty     text         not null default 'intermediate'
                              check (difficulty in ('beginner','intermediate','advanced')),
  -- share across all coaches in the platform
  is_public      boolean      not null default false,
  -- denormalised snapshot of the full program + workouts + exercises for fast duplication
  structure      jsonb        not null default '{}',
  created_at     timestamptz  not null default now(),
  updated_at     timestamptz  not null default now()
);

alter table public.program_templates enable row level security;

create policy "Coach manages own templates"
  on public.program_templates for all
  using (coach_id = auth.uid());

create policy "Coaches browse public templates"
  on public.program_templates for select
  using (is_public = true and auth.uid() is not null);

create trigger program_templates_updated_at
  before update on public.program_templates
  for each row execute procedure public.set_updated_at();

-- Now that both tables exist, add the deferred FK from programs → templates
alter table public.programs
  add constraint if not exists fk_programs_template
  foreign key (template_id)
  references public.program_templates(id)
  on delete set null
  not valid;  -- not valid = skip retroactive check, validate lazily

-- ── 7. Workout Logs ──────────────────────────────────────────

create table if not exists public.workout_logs (
  id               uuid         default gen_random_uuid() primary key,
  client_id        uuid         not null references public.profiles(id) on delete cascade,
  -- null when logging an ad-hoc session outside any program
  program_id       uuid         references public.programs(id) on delete set null,
  workout_id       uuid         references public.program_workouts(id) on delete set null,
  logged_at        timestamptz  not null default now(),
  duration_minutes integer,
  notes            text,
  created_at       timestamptz  not null default now()
);

create index if not exists idx_workout_logs_client  on public.workout_logs(client_id);
create index if not exists idx_workout_logs_workout on public.workout_logs(workout_id);
create index if not exists idx_workout_logs_date    on public.workout_logs(client_id, logged_at desc);

alter table public.workout_logs enable row level security;

create policy "Client manages own logs"
  on public.workout_logs for all
  using (client_id = auth.uid());

create policy "Coach reads client logs"
  on public.workout_logs for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = client_id and p.coach_id = auth.uid()
    )
  );

-- ── 8. Workout Log Sets ──────────────────────────────────────

create table if not exists public.workout_log_sets (
  id              uuid          default gen_random_uuid() primary key,
  log_id          uuid          not null references public.workout_logs(id) on delete cascade,
  exercise_id     uuid          not null references public.exercises(id),
  set_number      integer       not null,
  reps_completed  integer,
  -- always stored in kg regardless of input unit
  weight_kg       numeric(7,2),
  -- raw value as the user typed it
  weight_input    numeric(7,2),
  weight_unit     text          not null default 'kg' check (weight_unit in ('kg','lb')),
  rpe_actual      numeric(3,1)  check (rpe_actual between 1 and 10),
  notes           text,
  is_warmup       boolean       not null default false,
  created_at      timestamptz   not null default now()
);

create index if not exists idx_log_sets_log      on public.workout_log_sets(log_id);
create index if not exists idx_log_sets_exercise on public.workout_log_sets(exercise_id);

alter table public.workout_log_sets enable row level security;

create policy "Client manages own log sets"
  on public.workout_log_sets for all
  using (
    exists (
      select 1 from public.workout_logs wl
      where wl.id = log_id and wl.client_id = auth.uid()
    )
  );

create policy "Coach reads client log sets"
  on public.workout_log_sets for select
  using (
    exists (
      select 1 from public.workout_logs wl
      join public.profiles p on p.id = wl.client_id
      where wl.id = log_id and p.coach_id = auth.uid()
    )
  );

-- ── 9. Personal Bests ────────────────────────────────────────

create table if not exists public.personal_bests (
  id                uuid          default gen_random_uuid() primary key,
  client_id         uuid          not null references public.profiles(id) on delete cascade,
  exercise_id       uuid          not null references public.exercises(id),
  -- one PB row per (client, exercise, rep count) so we track 1RM, 3RM, 5RM, etc.
  reps              integer       not null,
  weight_kg         numeric(7,2)  not null,
  -- Epley formula: weight × (1 + reps/30)
  estimated_1rm_kg  numeric(7,2)  not null,
  achieved_at       timestamptz   not null default now(),
  -- which log set triggered this PB (nullable: may be manually entered)
  log_set_id        uuid          references public.workout_log_sets(id) on delete set null,
  created_at        timestamptz   not null default now(),
  unique (client_id, exercise_id, reps)
);

create index if not exists idx_personal_bests_client   on public.personal_bests(client_id);
create index if not exists idx_personal_bests_exercise on public.personal_bests(exercise_id);

alter table public.personal_bests enable row level security;

create policy "Client manages own PBs"
  on public.personal_bests for all
  using (client_id = auth.uid());

create policy "Coach reads client PBs"
  on public.personal_bests for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = client_id and p.coach_id = auth.uid()
    )
  );

-- ── Enable Realtime on workout_logs and personal_bests ───────

alter publication supabase_realtime add table public.workout_logs;
alter publication supabase_realtime add table public.personal_bests;
