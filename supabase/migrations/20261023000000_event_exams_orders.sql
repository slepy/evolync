/*
  Migration: Event exams and event-linked orders
  Date: 2026-10-23
  Description: An event can have exams planned; a participant can take the
  exam; an order can belong to the event it was placed for (10D Add order).
  All columns are additive with defaults / nullable, so existing rows and
  older app builds keep working. No RLS changes: staff policies on orders
  already cover organization owners, and the sync-user push drops
  takes_exam and orders.event_id from student devices.

  Deploy before an app build with WatermelonDB schema v23 (the client pushes
  these columns and the upsert fails without them), then redeploy `sync`.

  Spec: .ai/specs/2026-10-22-event-exams-and-orders.md
*/

alter table public.events
  add column if not exists exams_planned boolean not null default false;

alter table public.event_participants
  add column if not exists takes_exam boolean not null default false;

alter table public.orders
  add column if not exists event_id uuid null references public.events(id);

create index if not exists orders_event_id_idx
  on public.orders (event_id);
