/*
  Migration: Planned Trainings
  Date: 2026-10-04
  Description: Planned (future) trainings, separate from attendance's training_sessions.

  Tables:
  - training_series: recurring definition (rules + date range); its occurrences
    are materialized client-side as trainings rows linked by series_id
  - trainings: one row per concrete training on one day
  - training_invitees: selected people for 'whitelist' trainings

  Spec: .ai/specs/2026-10-03-planned-trainings.md
*/

-- 1. Tables
-- -----------------------------------------------------------------------------

create table public.training_series (
  id uuid not null default gen_random_uuid() primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  name text not null check (char_length(name) between 1 and 60),
  location text check (location is null or char_length(location) <= 300),
  visibility text not null default 'organization'
    check (visibility in ('organization', 'school', 'whitelist')),
  invitee_ids jsonb not null default '[]'::jsonb
    check (jsonb_typeof(invitee_ids) = 'array'),
  start_date date not null,
  end_date date not null,
  rules jsonb not null check (jsonb_typeof(rules) = 'array'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,

  constraint check_series_school_visibility check (
    visibility <> 'school' or school_id is not null
  ),
  constraint check_series_dates check (
    end_date >= start_date and end_date <= start_date + interval '6 months'
  )
);

alter table public.training_series enable row level security;

create trigger on_training_series_updated
  before update on public.training_series
  for each row execute procedure public.handle_updated_at();

create table public.trainings (
  id uuid not null default gen_random_uuid() primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  series_id uuid references public.training_series(id) on delete set null,
  name text not null check (char_length(name) between 1 and 60),
  date date not null,
  start_time text not null check (start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  end_time text not null check (end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  location text check (location is null or char_length(location) <= 300),
  visibility text not null default 'organization'
    check (visibility in ('organization', 'school', 'whitelist')),
  status text not null default 'active'
    check (status in ('active', 'cancelled')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,

  constraint check_training_school_visibility check (
    visibility <> 'school' or school_id is not null
  ),
  -- "HH:mm" strings compare correctly as text
  constraint check_training_times check (end_time > start_time)
);

alter table public.trainings enable row level security;

create trigger on_trainings_updated
  before update on public.trainings
  for each row execute procedure public.handle_updated_at();

create table public.training_invitees (
  id uuid not null default gen_random_uuid() primary key,
  training_id uuid not null references public.trainings(id) on delete cascade,
  school_member_id uuid not null references public.school_members(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,

  constraint unique_training_member unique (training_id, school_member_id)
);

alter table public.training_invitees enable row level security;

create trigger on_training_invitees_updated
  before update on public.training_invitees
  for each row execute procedure public.handle_updated_at();

-- 2. Indexes
-- -----------------------------------------------------------------------------

create index idx_trainings_org_date on public.trainings(organization_id, date);
create index idx_trainings_school_id on public.trainings(school_id);
create index idx_trainings_series_id on public.trainings(series_id);
create index idx_trainings_updated_at on public.trainings(updated_at);

create index idx_training_series_organization_id on public.training_series(organization_id);
create index idx_training_series_updated_at on public.training_series(updated_at);

create index idx_training_invitees_training_id on public.training_invitees(training_id);
create index idx_training_invitees_member_id on public.training_invitees(school_member_id);
create index idx_training_invitees_updated_at on public.training_invitees(updated_at);

-- 3. Helper Functions
-- -----------------------------------------------------------------------------

-- Can the current user see a training (analogous to can_view_event)?
create or replace function public.can_view_training(check_training_id uuid)
returns boolean as $$
declare
  v_training record;
begin
  select visibility, organization_id, school_id
  into v_training
  from public.trainings
  where id = check_training_id and deleted_at is null;

  if not found then
    return false;
  end if;

  if public.is_org_owner(v_training.organization_id) then
    return true;
  end if;

  case v_training.visibility
    when 'organization' then
      return public.is_member_of_org_school(v_training.organization_id);
    when 'school' then
      return v_training.school_id is not null
        and public.is_member_of_school(v_training.school_id);
    when 'whitelist' then
      return exists (
        select 1
        from public.training_invitees ti
        join public.school_members sm on ti.school_member_id = sm.id
        where ti.training_id = check_training_id
        and ti.deleted_at is null
        and sm.user_id = auth.uid()
      );
  end case;

  return false;
end;
$$ language plpgsql security definer stable;

create or replace function public.is_training_owner(check_training_id uuid)
returns boolean as $$
declare
  v_org_id uuid;
begin
  select organization_id into v_org_id
  from public.trainings
  where id = check_training_id;

  return v_org_id is not null and public.is_org_owner(v_org_id);
end;
$$ language plpgsql security definer stable;

-- 4. Row Level Security Policies
-- -----------------------------------------------------------------------------

create policy "Org owner can manage training series"
  on public.training_series for all
  to authenticated
  using (public.is_org_owner(organization_id))
  with check (
    public.is_org_owner(organization_id)
    and (school_id is null or exists (
      select 1 from public.schools s
      where s.id = school_id and s.organization_id = training_series.organization_id
    ))
  );

create policy "Org owner can manage trainings"
  on public.trainings for all
  to authenticated
  using (public.is_org_owner(organization_id))
  with check (
    public.is_org_owner(organization_id)
    and (school_id is null or exists (
      select 1 from public.schools s
      where s.id = school_id and s.organization_id = trainings.organization_id
    ))
  );

create policy "Members can view accessible trainings"
  on public.trainings for select
  to authenticated
  using (public.can_view_training(id));

create policy "Org owner can manage training invitees"
  on public.training_invitees for all
  to authenticated
  using (public.is_training_owner(training_id))
  with check (
    public.is_training_owner(training_id)
    -- only members of the training's own organization can be invited
    and exists (
      select 1
      from public.school_members sm
      join public.schools s on s.id = sm.school_id
      join public.trainings t on t.id = training_id
      where sm.id = school_member_id and s.organization_id = t.organization_id
    )
  );

create policy "Members can view own training invitations"
  on public.training_invitees for select
  to authenticated
  using (
    exists (
      select 1 from public.school_members sm
      where sm.id = school_member_id
      and sm.user_id = auth.uid()
    )
  );

comment on function public.can_view_training is
'Determines if the current user can view a planned training based on its visibility (organization, school, or whitelist).';

comment on function public.is_training_owner is
'Checks if the current user owns the organization of a planned training.';
