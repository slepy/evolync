/*
  Migration: Add avatar_url to school_members
  Date: 2026-02-19
  Description: Adds avatar_url column to school_members table and creates a trigger
  that automatically propagates avatar_url from auth.users metadata to all
  school_members rows linked to that user. This supports the offline-first
  architecture by making avatar URLs available locally via WatermelonDB sync.
*/

-- 1. Add avatar_url column to school_members
alter table public.school_members
  add column if not exists avatar_url text;

-- 2. Backfill existing rows from auth.users metadata
update public.school_members sm
set avatar_url = (
  select raw_user_meta_data->>'avatar_url'
  from auth.users u
  where u.id = sm.user_id
)
where sm.user_id is not null;

-- 3. Function to propagate avatar_url changes from auth.users to school_members
create or replace function public.sync_member_avatar_url()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_avatar_url text;
begin
  new_avatar_url := NEW.raw_user_meta_data->>'avatar_url';

  -- Update all school_members rows that reference this user
  update public.school_members
  set avatar_url = new_avatar_url,
      updated_at = now()
  where user_id = NEW.id
    and (avatar_url is distinct from new_avatar_url);

  return NEW;
end;
$$;

-- 4. Trigger on auth.users to fire when user metadata changes
drop trigger if exists on_auth_user_avatar_change on auth.users;
create trigger on_auth_user_avatar_change
  after update of raw_user_meta_data on auth.users
  for each row
  when (
    (OLD.raw_user_meta_data->>'avatar_url') is distinct from
    (NEW.raw_user_meta_data->>'avatar_url')
  )
  execute function public.sync_member_avatar_url();
