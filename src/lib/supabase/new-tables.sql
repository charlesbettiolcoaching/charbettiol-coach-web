-- Tasks table
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  coach_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  due_date date,
  completed boolean default false,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  created_at timestamptz default now() not null
);
alter table public.tasks enable row level security;
create policy "Coach manages tasks" on public.tasks for all using (coach_id = auth.uid());

-- Meal Plans
create table if not exists public.meal_plans (
  id uuid default gen_random_uuid() primary key,
  coach_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete set null,
  name text not null,
  description text,
  plan_type text default 'meal' check (plan_type in ('meal', 'macros')),
  calories_target integer,
  protein_target integer,
  carbs_target integer,
  fats_target integer,
  is_template boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
alter table public.meal_plans enable row level security;
create policy "Coach manages meal plans" on public.meal_plans for all using (coach_id = auth.uid());
create policy "Client views meal plans" on public.meal_plans for select using (client_id = auth.uid());

-- Meal Plan Days
create table if not exists public.meal_plan_days (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references public.meal_plans(id) on delete cascade not null,
  day_number integer not null,
  day_name text not null default 'Day',
  total_calories integer,
  created_at timestamptz default now() not null
);
alter table public.meal_plan_days enable row level security;
create policy "Access meal plan days" on public.meal_plan_days for all using (
  exists (select 1 from public.meal_plans mp where mp.id = plan_id and (mp.coach_id = auth.uid() or mp.client_id = auth.uid()))
);

-- Meal Plan Meals
create table if not exists public.meal_plan_meals (
  id uuid default gen_random_uuid() primary key,
  day_id uuid references public.meal_plan_days(id) on delete cascade not null,
  meal_name text not null,
  order_index integer default 0,
  created_at timestamptz default now() not null
);
alter table public.meal_plan_meals enable row level security;
create policy "Access meal plan meals" on public.meal_plan_meals for all using (
  exists (
    select 1 from public.meal_plan_days mpd
    join public.meal_plans mp on mp.id = mpd.plan_id
    where mpd.id = day_id and (mp.coach_id = auth.uid() or mp.client_id = auth.uid())
  )
);

-- Meal Plan Foods
create table if not exists public.meal_plan_foods (
  id uuid default gen_random_uuid() primary key,
  meal_id uuid references public.meal_plan_meals(id) on delete cascade not null,
  name text not null,
  quantity text not null default '1 serving',
  calories integer,
  protein_g numeric(6,1),
  carbs_g numeric(6,1),
  fats_g numeric(6,1),
  notes text,
  created_at timestamptz default now() not null
);
alter table public.meal_plan_foods enable row level security;
create policy "Access meal plan foods" on public.meal_plan_foods for all using (
  exists (
    select 1 from public.meal_plan_meals mpm
    join public.meal_plan_days mpd on mpd.id = mpm.day_id
    join public.meal_plans mp on mp.id = mpd.plan_id
    where mpm.id = meal_id and (mp.coach_id = auth.uid() or mp.client_id = auth.uid())
  )
);

-- Autoflows
create table if not exists public.autoflows (
  id uuid default gen_random_uuid() primary key,
  coach_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete set null,
  name text not null,
  trigger_type text default 'day' check (trigger_type in ('day', 'event', 'manual')),
  is_active boolean default true,
  created_at timestamptz default now() not null
);
alter table public.autoflows enable row level security;
create policy "Coach manages autoflows" on public.autoflows for all using (coach_id = auth.uid());

-- Autoflow Events
create table if not exists public.autoflow_events (
  id uuid default gen_random_uuid() primary key,
  autoflow_id uuid references public.autoflows(id) on delete cascade not null,
  event_type text not null check (event_type in ('workout_program', 'resources', 'message', 'email', 'notification', 'note')),
  day_offset integer not null default 0,
  payload jsonb default '{}',
  created_at timestamptz default now() not null
);
alter table public.autoflow_events enable row level security;
create policy "Coach manages autoflow events" on public.autoflow_events for all using (
  exists (select 1 from public.autoflows a where a.id = autoflow_id and a.coach_id = auth.uid())
);

-- Add notes and created_at columns to workout_days if not present
alter table public.workout_days add column if not exists notes text;
alter table public.workout_days add column if not exists created_at timestamptz default now() not null;

-- Add movement_pattern, equipment, rest_seconds, notes to workout_exercises if not present
alter table public.workout_exercises add column if not exists movement_pattern text;
alter table public.workout_exercises add column if not exists equipment text;
alter table public.workout_exercises add column if not exists rest_seconds integer default 90;
alter table public.workout_exercises add column if not exists notes text;
alter table public.workout_exercises add column if not exists created_at timestamptz default now() not null;

-- Add created_at to exercise_sets if not present
alter table public.exercise_sets add column if not exists created_at timestamptz default now() not null;
