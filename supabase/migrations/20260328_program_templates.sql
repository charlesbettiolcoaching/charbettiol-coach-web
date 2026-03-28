-- Program templates table
-- Allows coaches to save reusable workout program structures

create table if not exists program_templates (
  id             uuid primary key default gen_random_uuid(),
  coach_id       uuid not null references auth.users(id) on delete cascade,
  name           text not null,
  description    text,
  duration_weeks integer not null default 4,
  days_per_week  integer not null default 3,
  goal           text not null default 'general_fitness',
  difficulty     text not null default 'intermediate',
  is_public      boolean not null default false,
  structure      jsonb not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- RLS
alter table program_templates enable row level security;

-- Coach can see their own templates + all public templates
create policy "program_templates_select" on program_templates
  for select using (coach_id = auth.uid() or is_public = true);

-- Coach can insert their own templates
create policy "program_templates_insert" on program_templates
  for insert with check (coach_id = auth.uid());

-- Coach can update their own templates
create policy "program_templates_update" on program_templates
  for update using (coach_id = auth.uid());

-- Coach can delete their own templates
create policy "program_templates_delete" on program_templates
  for delete using (coach_id = auth.uid());

-- Auto-update updated_at
create or replace function update_program_templates_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger program_templates_updated_at
  before update on program_templates
  for each row execute function update_program_templates_updated_at();
