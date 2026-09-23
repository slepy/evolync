/*
  Migration: Fix School Access for School Members
  Date: 2026-02-10
  Description: Allow school members to view schools they belong to.
  Currently only organization owners can view schools, which prevents
  students from seeing school data when joining via invite code.

  Also fixes the ability for users to find their shadow user records
  (records with matching email but null user_id) when joining a school.
*/

-- Add policy to allow school members to view schools they belong to
create policy "Schools are viewable by school members"
  on public.schools for select
  to authenticated
  using (
    exists (
      select 1 from public.school_members sm
      where sm.school_id = schools.id
        and sm.user_id = auth.uid()
        and sm.deleted_at is null
    )
  );

-- Create a function to get current user's email from JWT claims
-- This is needed because we cannot directly query auth.users from RLS policies
create or replace function public.current_user_email()
returns text
language sql
stable
security definer
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::json->>'email',
    null
  )::text;
$$;

-- Add policy to allow users to see school_members records that match their email
-- This is needed for join flow when shadow user exists (user_id is NULL, but email matches)
create policy "Users can see memberships by email"
  on public.school_members for select
  to authenticated
  using (
    email = public.current_user_email()
  );

-- Add policy to allow users to update school_members records that match their email
-- This is needed when activating a shadow user account during join flow
create policy "Users can update memberships by email"
  on public.school_members for update
  to authenticated
  using (
    email = public.current_user_email()
  )
  with check (
    email = public.current_user_email()
  );
