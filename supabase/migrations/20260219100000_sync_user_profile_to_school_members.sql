/*
  Migration: Sync user profile (full_name + avatar_url) to school_members
  Date: 2026-02-19
  Description: Replaces the avatar-only trigger with a unified trigger that
  propagates both display_name (from full_name) and avatar_url from
  auth.users raw_user_meta_data to all school_members rows linked to that user.
  This ensures profile changes are automatically reflected everywhere via
  the existing WatermelonDB sync mechanism.
*/

-- 1. Drop the old avatar-only trigger
drop trigger if exists on_auth_user_avatar_change on auth.users;
drop function if exists public.sync_member_avatar_url();

-- 2. Create unified function to propagate profile changes
create or replace function public.sync_user_profile_to_members()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_display_name text;
  new_avatar_url text;
begin
  new_display_name := NEW.raw_user_meta_data->>'full_name';
  new_avatar_url   := NEW.raw_user_meta_data->>'avatar_url';

  update public.school_members
  set
    display_name = coalesce(new_display_name, display_name),
    avatar_url   = new_avatar_url,
    updated_at   = now()
  where user_id = NEW.id
    and (
      display_name is distinct from coalesce(new_display_name, display_name)
      or avatar_url is distinct from new_avatar_url
    );

  return NEW;
end;
$$;

-- 3. Trigger on auth.users — fires when user metadata changes
create trigger on_auth_user_profile_change
  after update of raw_user_meta_data on auth.users
  for each row
  when (
    (OLD.raw_user_meta_data->>'full_name')  is distinct from (NEW.raw_user_meta_data->>'full_name')
    or
    (OLD.raw_user_meta_data->>'avatar_url') is distinct from (NEW.raw_user_meta_data->>'avatar_url')
  )
  execute function public.sync_user_profile_to_members();

-- 4. Backfill display_name for existing rows that have a user_id but no display_name
update public.school_members sm
set display_name = u.raw_user_meta_data->>'full_name'
from auth.users u
where u.id = sm.user_id
  and sm.display_name is null
  and u.raw_user_meta_data->>'full_name' is not null;
