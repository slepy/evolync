/*
  Migration: Attendance Sessions Schema
  Date: 2026-01-22
  Description: Replaces old 'attendance' table with new two-table design:
    - training_sessions: Sessions grouped by school + date
    - attendance_records: Individual attendance per member per session

  This migration:
  1. Drops the old 'attendance' table (no data to preserve)
  2. Creates new training_sessions and attendance_records tables
*/

-- 1. Remove old attendance table and related objects
-- -----------------------------------------------------------------------------

drop policy if exists "Org owner can manage attendance" on public.attendance;
drop policy if exists "Student can view own attendance" on public.attendance;
drop trigger if exists on_attendance_updated on public.attendance;
drop index if exists idx_attendance_school_id;
drop index if exists idx_attendance_user_id;
drop index if exists idx_attendance_updated_at;
drop index if exists idx_attendance_school_date;
drop table if exists public.attendance;

-- 2. Create new tables
-- -----------------------------------------------------------------------------

-- Table: training_sessions
-- Represents a single training session at a school on a specific date
create table public.training_sessions (
  id uuid not null default gen_random_uuid() primary key,
  school_id uuid not null references public.schools(id) on delete cascade,
  date date not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,

  -- Ensure unique session per school per date
  constraint unique_school_date unique (school_id, date)
);

alter table public.training_sessions enable row level security;

create trigger on_training_sessions_updated
  before update on public.training_sessions
  for each row execute procedure public.handle_updated_at();

-- Table: attendance_records
-- Individual attendance record for a member in a specific session
create table public.attendance_records (
  id uuid not null default gen_random_uuid() primary key,
  training_session_id uuid not null references public.training_sessions(id) on delete cascade,
  school_member_id uuid not null references public.school_members(id) on delete cascade,
  status public.attendance_status default 'absent',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,

  -- Ensure one record per member per session
  constraint unique_member_session unique (training_session_id, school_member_id)
);

alter table public.attendance_records enable row level security;

create trigger on_attendance_records_updated
  before update on public.attendance_records
  for each row execute procedure public.handle_updated_at();

-- 3. Indexes
-- -----------------------------------------------------------------------------

-- Foreign key indexes
create index idx_training_sessions_school_id on public.training_sessions(school_id);
create index idx_attendance_records_session_id on public.attendance_records(training_session_id);
create index idx_attendance_records_member_id on public.attendance_records(school_member_id);

-- WatermelonDB sync indexes (critical for pull changes)
create index idx_training_sessions_updated_at on public.training_sessions(updated_at);
create index idx_attendance_records_updated_at on public.attendance_records(updated_at);

-- Query optimization indexes
create index idx_training_sessions_school_date on public.training_sessions(school_id, date desc);

-- 4. Row Level Security Policies
-- -----------------------------------------------------------------------------

-- Training Sessions: Only org owner can manage
create policy "Org owner can manage training sessions"
  on public.training_sessions for all
  to authenticated
  using (public.is_school_owner(school_id))
  with check (public.is_school_owner(school_id));

-- Training Sessions: Members can view sessions for their school
create policy "School members can view training sessions"
  on public.training_sessions for select
  to authenticated
  using (public.is_member_of_school(school_id));

-- Attendance Records: Only org owner can manage
create policy "Org owner can manage attendance records"
  on public.attendance_records for all
  to authenticated
  using (
    exists (
      select 1 from public.training_sessions ts
      where ts.id = training_session_id
      and public.is_school_owner(ts.school_id)
    )
  )
  with check (
    exists (
      select 1 from public.training_sessions ts
      where ts.id = training_session_id
      and public.is_school_owner(ts.school_id)
    )
  );

-- Attendance Records: Members can view their own attendance
create policy "Members can view own attendance"
  on public.attendance_records for select
  to authenticated
  using (
    exists (
      select 1 from public.school_members sm
      where sm.id = school_member_id
      and sm.user_id = auth.uid()
    )
  );
