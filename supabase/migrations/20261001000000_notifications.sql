-- ============================================================================
-- Notifications module (spec: .ai/specs/2026-10-01-notifications-module.md)
--
-- Notifications are generated server-side by AFTER triggers on the source
-- tables, so every write path (sync, RPC, dashboard) produces exactly one row
-- and changes made offline notify the recipient once they reach Supabase.
-- Clients read their own rows through sync and may only set `read_at`.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. notifications table
-- ----------------------------------------------------------------------------
create table if not exists public.notifications (
  id              uuid primary key default gen_random_uuid(),
  recipient_id    uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  school_id       uuid references public.schools(id) on delete set null,
  type            text not null check (type in (
                    'order_created',
                    'join_request_created',
                    'event_rsvp_attending',
                    'payment_created',
                    'event_assigned'
                  )),
  entity_type     text not null,
  entity_id       uuid not null,
  -- Display data captured at trigger time so the inbox renders without joins
  -- and survives deletion of the source row.
  payload         jsonb not null default '{}'::jsonb,
  read_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index if not exists idx_notifications_recipient_created
  on public.notifications (recipient_id, created_at desc);

create index if not exists idx_notifications_recipient_updated
  on public.notifications (recipient_id, updated_at);

-- Idempotency: a re-pushed sync batch or an attending → absent → attending flip
-- never creates a second row for the same recipient, type and source entity.
create unique index if not exists uq_notifications_recipient_type_entity
  on public.notifications (recipient_id, type, entity_id)
  where deleted_at is null;

create trigger on_notifications_updated
  before update on public.notifications
  for each row execute procedure public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 2. RLS — recipients read their rows and may only mark them read.
--    Inserts come exclusively from security-definer triggers.
-- ----------------------------------------------------------------------------
alter table public.notifications enable row level security;

create policy "Recipients can read own notifications"
  on public.notifications
  for select
  using (recipient_id = auth.uid());

create policy "Recipients can mark own notifications read"
  on public.notifications
  for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- Column-level guard: `read_at` is the only client-writable column.
revoke insert, update, delete on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
