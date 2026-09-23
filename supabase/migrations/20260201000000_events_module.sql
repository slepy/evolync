/*
  Migration: Events Module Schema
  Date: 2026-02-01
  Description: Creates the events module for organizing seminars, camps, workshops, etc.

  Tables:
  - events: Main event records with visibility and status
  - event_participants: Participation status per member per event
    (also serves as whitelist for 'whitelist' visibility events)

  Based on PRD: .ai/events/event_prd.md
*/

-- 1. Data Types (ENUMs)
-- -----------------------------------------------------------------------------

create type public.event_status as enum ('active', 'cancelled');
create type public.event_visibility as enum ('organization', 'school', 'whitelist');
create type public.event_participant_status as enum ('absent', 'attending', 'paid');

-- 2. Tables
-- -----------------------------------------------------------------------------

-- Table: events
-- Main event record with visibility levels and lifecycle management
create table public.events (
  id uuid not null default gen_random_uuid() primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null, -- Required when visibility = 'school'
  name text not null,
  short_note text, -- Brief note visible on event list (e.g., "Protective gear required")
  address text, -- Event location as free text
  start_date date not null,
  end_date date not null,
  price numeric(10,2) not null default 0 check (price >= 0),
  currency text not null default 'PLN',
  visibility public.event_visibility not null default 'organization',
  status public.event_status not null default 'active',
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,

  -- Ensure end_date is not before start_date
  constraint check_dates check (end_date >= start_date),
  -- Ensure school_id is set when visibility is 'school'
  constraint check_school_visibility check (
    visibility != 'school' or school_id is not null
  )
);

alter table public.events enable row level security;

create trigger on_events_updated
  before update on public.events
  for each row execute procedure public.handle_updated_at();

-- Table: event_participants
-- Tracks participation status for each member in an event
-- For 'whitelist' visibility, existence of record = user can see the event
create table public.event_participants (
  id uuid not null default gen_random_uuid() primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  school_member_id uuid not null references public.school_members(id) on delete cascade,
  status public.event_participant_status not null default 'absent',
  status_changed_by uuid references auth.users(id), -- Who last changed the status (for audit)
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,

  -- One record per member per event
  constraint unique_event_member unique (event_id, school_member_id)
);

alter table public.event_participants enable row level security;

create trigger on_event_participants_updated
  before update on public.event_participants
  for each row execute procedure public.handle_updated_at();

-- 3. Indexes
-- -----------------------------------------------------------------------------

-- Foreign key indexes
create index idx_events_organization_id on public.events(organization_id);
create index idx_events_school_id on public.events(school_id);
create index idx_events_created_by on public.events(created_by);
create index idx_event_participants_event_id on public.event_participants(event_id);
create index idx_event_participants_member_id on public.event_participants(school_member_id);

-- WatermelonDB sync indexes (critical for pull changes)
create index idx_events_updated_at on public.events(updated_at);
create index idx_event_participants_updated_at on public.event_participants(updated_at);

-- Query optimization indexes
create index idx_events_dates on public.events(start_date, end_date);
create index idx_events_visibility on public.events(visibility);
create index idx_events_status on public.events(status);
create index idx_events_org_start_date on public.events(organization_id, start_date desc);

-- 4. Helper Functions
-- -----------------------------------------------------------------------------

-- Check if user can view event based on visibility rules
create or replace function public.can_view_event(check_event_id uuid)
returns boolean as $$
declare
  v_event record;
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  -- Get event details
  select visibility, organization_id, school_id
  into v_event
  from public.events
  where id = check_event_id and deleted_at is null;

  if not found then
    return false;
  end if;

  -- Org owner always has access
  if public.is_org_owner(v_event.organization_id) then
    return true;
  end if;

  -- Check based on visibility level
  case v_event.visibility
    when 'organization' then
      -- All members of any school in the organization can see
      return public.is_member_of_org_school(v_event.organization_id);

    when 'school' then
      -- Only members of the specific school can see
      return public.is_member_of_school(v_event.school_id);

    when 'whitelist' then
      -- Only members with participant record can see
      return exists (
        select 1
        from public.event_participants ep
        join public.school_members sm on ep.school_member_id = sm.id
        where ep.event_id = check_event_id
        and ep.deleted_at is null
        and sm.user_id = v_user_id
      );
  end case;

  return false;
end;
$$ language plpgsql security definer;

-- Check if user is instructor/owner for an event
create or replace function public.is_event_instructor(check_event_id uuid)
returns boolean as $$
declare
  v_org_id uuid;
begin
  select organization_id into v_org_id
  from public.events
  where id = check_event_id;

  if v_org_id is null then
    return false;
  end if;

  return public.is_org_owner(v_org_id);
end;
$$ language plpgsql security definer;

-- Check if event has any paid participants (for delete restriction)
create or replace function public.event_has_paid_participants(check_event_id uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from public.event_participants
    where event_id = check_event_id
    and status = 'paid'
    and deleted_at is null
  );
end;
$$ language plpgsql security definer;

-- 5. Row Level Security Policies
-- -----------------------------------------------------------------------------

-- Events: Org owner has full access
create policy "Org owner can manage events"
  on public.events for all
  to authenticated
  using (public.is_org_owner(organization_id))
  with check (public.is_org_owner(organization_id));

-- Events: Members can view events they have access to
create policy "Members can view accessible events"
  on public.events for select
  to authenticated
  using (public.can_view_event(id));

-- Event Participants: Org owner/instructor has full control
create policy "Instructor can manage all participants"
  on public.event_participants for all
  to authenticated
  using (public.is_event_instructor(event_id))
  with check (public.is_event_instructor(event_id));

-- Event Participants: Members can view their own participation
create policy "Members can view own participation"
  on public.event_participants for select
  to authenticated
  using (
    exists (
      select 1 from public.school_members sm
      where sm.id = school_member_id
      and sm.user_id = auth.uid()
    )
  );

-- Event Participants: Members can update their own status (with restrictions)
-- Students can only toggle between 'absent' and 'attending', not 'paid'
create policy "Members can update own participation status"
  on public.event_participants for update
  to authenticated
  using (
    exists (
      select 1 from public.school_members sm
      where sm.id = school_member_id
      and sm.user_id = auth.uid()
    )
    -- Cannot change if status is 'paid' (locked by instructor)
    and status != 'paid'
  )
  with check (
    exists (
      select 1 from public.school_members sm
      where sm.id = school_member_id
      and sm.user_id = auth.uid()
    )
    -- Students can only set 'absent' or 'attending', not 'paid'
    and status in ('absent', 'attending')
  );

-- 6. Trigger: Prevent deletion of events with paid participants
-- -----------------------------------------------------------------------------

create or replace function public.check_event_can_be_deleted()
returns trigger as $$
begin
  if public.event_has_paid_participants(old.id) then
    raise exception 'Cannot delete event with paid participants. Cancel the event instead.';
  end if;
  return old;
end;
$$ language plpgsql;

create trigger on_event_delete_check
  before delete on public.events
  for each row execute procedure public.check_event_can_be_deleted();

comment on function public.can_view_event is
'Determines if the current user can view an event based on its visibility level (organization, school, or whitelist).';

comment on function public.is_event_instructor is
'Checks if the current user is the organization owner/instructor for the event.';

comment on function public.event_has_paid_participants is
'Checks if an event has any participants with paid status. Used to prevent deletion of events with payments.';
