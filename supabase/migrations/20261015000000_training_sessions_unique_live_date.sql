/*
  Migration: One live attendance session per school per day
  Date: 2026-10-15
  Description: Instructors can delete (soft delete) an attendance session. The
  old unique (school_id, date) constraint also counted deleted rows, so creating
  a new session on the day of a deleted one failed the sync push. Uniqueness
  now applies to live rows only.

  Spec: .ai/specs/2026-09-26-attendance-module.md (Fix #6)
*/

alter table public.training_sessions
  drop constraint if exists unique_school_date;

create unique index if not exists unique_school_date_live
  on public.training_sessions (school_id, date)
  where deleted_at is null;
