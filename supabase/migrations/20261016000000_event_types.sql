/*
  Migration: Event types
  Date: 2026-10-16
  Description: Instructor-defined types of events (Seminar, Camp, Competition…),
  shared by the organization. Every event can point at one type; the column is
  nullable so existing events stay valid (the app requires a type on save).

  Spec: .ai/specs/2026-10-16-event-types.md
*/

-- Table: event_types
create table if not exists public.event_types (
  id uuid not null default gen_random_uuid() primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create index if not exists event_types_organization_id_idx
  on public.event_types (organization_id);

alter table public.event_types enable row level security;

drop trigger if exists on_event_types_updated on public.event_types;
create trigger on_event_types_updated
  before update on public.event_types
  for each row execute procedure public.handle_updated_at();

-- Owner manages the organization's types; members of its schools read them
-- (students see the type name on their events).
drop policy if exists "Org owner can manage event types" on public.event_types;
create policy "Org owner can manage event types"
  on public.event_types for all
  to authenticated
  using (public.is_org_owner(organization_id))
  with check (public.is_org_owner(organization_id));

drop policy if exists "Members can view event types" on public.event_types;
create policy "Members can view event types"
  on public.event_types for select
  to authenticated
  using (public.is_member_of_org_school(organization_id));

-- events.type_id: optional, no cascade (a type in use is never deleted by the app)
alter table public.events
  add column if not exists type_id uuid references public.event_types(id);

create index if not exists events_type_id_idx on public.events (type_id);
