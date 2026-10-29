-- Join requests carry a status: pending, or rejected by the school owner.
-- The app has stored and synced it since 2026-09-28 (commit 2c81b92, the
-- "pending/rejected card" change), but the column never existed here, so every
-- pushed request failed ("Could not find the 'status' column") and was dropped
-- by the sync: no join request has reached the server since then.
alter table public.school_join_requests
  add column if not exists status text not null default 'pending'
    constraint school_join_requests_status_check check (status in ('pending', 'rejected'));

-- One *pending* request per user and school, as the original constraint meant
-- ("Prevent duplicate pending requests"): a rejected, dismissed or approved
-- (soft-deleted) request no longer blocks a new one.
alter table public.school_join_requests
  drop constraint if exists school_join_requests_user_id_school_id_key;

create unique index if not exists uq_school_join_requests_pending
  on public.school_join_requests (user_id, school_id)
  where deleted_at is null and status = 'pending';
