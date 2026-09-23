-- Migration: school_join_requests table
-- Stores join requests from users who scanned an invite code.
-- The school owner reviews these and either approves (creating a school_member) or rejects (soft-delete).

create table if not exists public.school_join_requests (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  email       text not null,
  phone_number text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,

  -- Prevent duplicate pending requests
  unique (user_id, school_id)
);

-- Index for owner queries
create index if not exists idx_school_join_requests_school_id
  on public.school_join_requests (school_id)
  where deleted_at is null;

-- RLS
alter table public.school_join_requests enable row level security;

-- The requesting user can insert their own request
create policy "Users can create own join requests"
  on public.school_join_requests
  for insert
  with check (auth.uid() = user_id);

-- The requesting user can read their own requests
create policy "Users can read own join requests"
  on public.school_join_requests
  for select
  using (auth.uid() = user_id);

-- The school owner (via organization ownership) can read all requests for their schools
create policy "School owner can read join requests"
  on public.school_join_requests
  for select
  using (
    exists (
      select 1
      from public.schools s
      join public.organizations o on o.id = s.organization_id
      where s.id = school_join_requests.school_id
        and o.owner_id = auth.uid()
    )
  );

-- The school owner can update (soft-delete = reject) join requests
create policy "School owner can update join requests"
  on public.school_join_requests
  for update
  using (
    exists (
      select 1
      from public.schools s
      join public.organizations o on o.id = s.organization_id
      where s.id = school_join_requests.school_id
        and o.owner_id = auth.uid()
    )
  );
