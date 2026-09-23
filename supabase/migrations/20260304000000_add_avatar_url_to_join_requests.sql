-- Add avatar_url to school_join_requests to match school_members
alter table public.school_join_requests
  add column if not exists avatar_url text;
