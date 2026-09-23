/*
  Migration: Add phone_number to school_members
  Date: 2026-03-02
  Description:
    1. Adds phone_number column to school_members table.
    2. Backfills phone_number from auth.users metadata for existing rows.
    3. Extends the existing sync trigger so profile edits (phone_number)
       are automatically propagated to all school_members rows with the same user_id.
*/

-- 1. Add column
alter table public.school_members
  add column if not exists phone_number text;

-- 2. Backfill from auth.users metadata for existing members
update public.school_members sm
set phone_number = u.raw_user_meta_data->>'phone_number'
from auth.users u
where u.id = sm.user_id
  and sm.phone_number is null
  and u.raw_user_meta_data->>'phone_number' is not null;

-- 3. Drop old trigger & function so we can recreate with phone_number support
drop trigger if exists on_auth_user_profile_change on auth.users;
drop function if exists public.sync_user_profile_to_members();

-- 4. Recreate unified sync function (full_name + avatar_url + phone_number)
create or replace function public.sync_user_profile_to_members()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_display_name text;
  new_avatar_url   text;
  new_phone_number text;
begin
  new_display_name := NEW.raw_user_meta_data->>'full_name';
  new_avatar_url   := NEW.raw_user_meta_data->>'avatar_url';
  new_phone_number := NEW.raw_user_meta_data->>'phone_number';

  update public.school_members
  set
    display_name  = coalesce(new_display_name, display_name),
    avatar_url    = new_avatar_url,
    phone_number  = new_phone_number,
    updated_at    = now()
  where user_id = NEW.id
    and (
      display_name  is distinct from coalesce(new_display_name, display_name)
      or avatar_url    is distinct from new_avatar_url
      or phone_number  is distinct from new_phone_number
    );

  return NEW;
end;
$$;

-- 5. Recreate trigger — fires when full_name, avatar_url, or phone_number changes
create trigger on_auth_user_profile_change
  after update of raw_user_meta_data on auth.users
  for each row
  when (
    (OLD.raw_user_meta_data->>'full_name')    is distinct from (NEW.raw_user_meta_data->>'full_name')
    or (OLD.raw_user_meta_data->>'avatar_url')  is distinct from (NEW.raw_user_meta_data->>'avatar_url')
    or (OLD.raw_user_meta_data->>'phone_number') is distinct from (NEW.raw_user_meta_data->>'phone_number')
  )
  execute function public.sync_user_profile_to_members();
