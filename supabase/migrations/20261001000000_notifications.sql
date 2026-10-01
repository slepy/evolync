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

-- ----------------------------------------------------------------------------
-- 3. Actor resolution
--    Direct authenticated calls carry the user in auth.uid(). The sync Edge
--    Function writes with the service role (auth.uid() is null) and forwards
--    the verified user id in the `x-evolync-actor` request header instead.
-- ----------------------------------------------------------------------------
create or replace function public.notification_actor()
returns uuid
language plpgsql
stable
as $$
declare
  header_actor text;
begin
  if auth.uid() is not null then
    return auth.uid();
  end if;

  header_actor := nullif(current_setting('request.headers', true), '')::json ->> 'x-evolync-actor';
  return nullif(header_actor, '')::uuid;
exception when others then
  return null;
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. notify() — the single insert path for notifications.
--    Skips a null recipient (offline members have no account) and never
--    notifies the actor. With p_resurface, a repeat event refreshes the
--    existing row and marks it unread instead of creating a duplicate.
-- ----------------------------------------------------------------------------
create or replace function public.notify(
  p_recipient uuid,
  p_type text,
  p_payload jsonb,
  p_entity_type text,
  p_entity_id uuid,
  p_organization_id uuid default null,
  p_school_id uuid default null,
  p_resurface boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_recipient is null or p_recipient is not distinct from public.notification_actor() then
    return;
  end if;

  insert into public.notifications (
    recipient_id, organization_id, school_id, type, entity_type, entity_id, payload
  ) values (
    p_recipient, p_organization_id, p_school_id, p_type, p_entity_type, p_entity_id,
    coalesce(p_payload, '{}'::jsonb)
  )
  on conflict (recipient_id, type, entity_id) where deleted_at is null
  do update set payload = excluded.payload, read_at = null
    where p_resurface;
end;
$$;

revoke execute on function public.notify(uuid, text, jsonb, text, uuid, uuid, uuid, boolean)
  from public, anon, authenticated;

-- Owner of the organization a school belongs to.
create or replace function public.school_owner(p_school_id uuid, out owner_id uuid, out organization_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select o.owner_id, o.id
  from public.schools s
  join public.organizations o on o.id = s.organization_id
  where s.id = p_school_id
    and o.deleted_at is null
$$;

revoke execute on function public.school_owner(uuid) from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5. N1 — owner: new order
-- ----------------------------------------------------------------------------
create or replace function public.notify_order_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner record;
  v_member record;
begin
  begin
    if new.deleted_at is not null then
      return new;
    end if;

    select * into v_owner from public.school_owner(new.school_id);
    select user_id, coalesce(display_name, email) as name
      into v_member
      from public.school_members where id = new.school_member_id;

    -- An owner ordering on their own behalf is the actor.
    if v_owner.owner_id is not distinct from v_member.user_id then
      return new;
    end if;

    perform public.notify(
      v_owner.owner_id,
      'order_created',
      jsonb_build_object(
        'studentName', v_member.name,
        'itemCount', (
          select coalesce(sum(quantity), 0)::int from public.order_items
          where order_id = new.id and deleted_at is null
        ),
        'orderId', new.id
      ),
      'order',
      new.id,
      v_owner.organization_id,
      new.school_id
    );
  exception when others then
    raise warning 'notify_order_created failed for order %: %', new.id, sqlerrm;
  end;
  return new;
end;
$$;

create trigger on_orders_notify_created
  after insert on public.orders
  for each row execute procedure public.notify_order_created();

-- Order items sync after their order, so keep N1's item count current.
create or replace function public.refresh_order_notification_item_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    update public.notifications
       set payload = payload || jsonb_build_object(
         'itemCount', (
           select coalesce(sum(quantity), 0)::int from public.order_items
           where order_id = new.order_id and deleted_at is null
         )
       )
     where type = 'order_created'
       and entity_id = new.order_id
       and deleted_at is null;
  exception when others then
    raise warning 'refresh_order_notification_item_count failed for order %: %', new.order_id, sqlerrm;
  end;
  return new;
end;
$$;

create trigger on_order_items_refresh_notification
  after insert on public.order_items
  for each row execute procedure public.refresh_order_notification_item_count();

-- ----------------------------------------------------------------------------
-- 6. N2 — owner: new join request
--    A live row is a pending request (rejection soft-deletes it). When a
--    `status` value is present it must be 'pending'; read via to_jsonb so the
--    trigger works whether or not the column exists.
-- ----------------------------------------------------------------------------
create or replace function public.notify_join_request_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner record;
  v_status text;
begin
  begin
    v_status := coalesce(to_jsonb(new) ->> 'status', 'pending');
    if new.deleted_at is not null or v_status <> 'pending' then
      return new;
    end if;

    select * into v_owner from public.school_owner(new.school_id);
    if v_owner.owner_id is not distinct from new.user_id then
      return new;
    end if;

    perform public.notify(
      v_owner.owner_id,
      'join_request_created',
      jsonb_build_object(
        'displayName', new.display_name,
        'schoolName', (select name from public.schools where id = new.school_id)
      ),
      'school_join_request',
      new.id,
      v_owner.organization_id,
      new.school_id
    );
  exception when others then
    raise warning 'notify_join_request_created failed for request %: %', new.id, sqlerrm;
  end;
  return new;
end;
$$;

create trigger on_school_join_requests_notify_created
  after insert on public.school_join_requests
  for each row execute procedure public.notify_join_request_created();

-- ----------------------------------------------------------------------------
-- 7. N3 (owner: student RSVPs "attending") and N5 (student: added to event)
--    status_changed_by tells who acted: the participant themself (RSVP) or
--    someone else (instructor assignment / whitelist / approval).
-- ----------------------------------------------------------------------------
create or replace function public.notify_event_participant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member record;
  v_event record;
  v_owner_id uuid;
  v_self_changed boolean;
begin
  begin
    if new.deleted_at is not null then
      return new;
    end if;

    select user_id, school_id, coalesce(display_name, email) as name
      into v_member
      from public.school_members where id = new.school_member_id;

    -- Offline members have no account: nobody to notify, and no RSVP possible.
    if v_member.user_id is null then
      return new;
    end if;

    select id, organization_id, school_id, name, start_date
      into v_event
      from public.events where id = new.event_id;

    v_self_changed := new.status_changed_by is not distinct from v_member.user_id;

    -- N3: student set their own status to attending.
    if new.status = 'attending'
       and v_self_changed
       and (tg_op = 'INSERT' or old.status is distinct from 'attending') then
      select owner_id into v_owner_id
        from public.organizations where id = v_event.organization_id;

      if v_owner_id is distinct from v_member.user_id then
        perform public.notify(
          v_owner_id,
          'event_rsvp_attending',
          jsonb_build_object(
            'studentName', v_member.name,
            'eventName', v_event.name,
            'eventId', v_event.id
          ),
          'event_participant',
          new.id,
          v_event.organization_id,
          coalesce(v_event.school_id, v_member.school_id),
          true
        );
      end if;
    end if;

    -- N5: someone else added the student to the event.
    if tg_op = 'INSERT' and not v_self_changed then
      perform public.notify(
        v_member.user_id,
        'event_assigned',
        jsonb_build_object(
          'eventName', v_event.name,
          'startDate', v_event.start_date,
          'eventId', v_event.id
        ),
        'event_participant',
        new.id,
        v_event.organization_id,
        coalesce(v_event.school_id, v_member.school_id)
      );
    end if;
  exception when others then
    raise warning 'notify_event_participant failed for participant %: %', new.id, sqlerrm;
  end;
  return new;
end;
$$;

create trigger on_event_participants_notify_insert
  after insert on public.event_participants
  for each row execute procedure public.notify_event_participant();

create trigger on_event_participants_notify_status
  after update of status, status_changed_by on public.event_participants
  for each row execute procedure public.notify_event_participant();

-- ----------------------------------------------------------------------------
-- 8. N4 — student: new payment record
-- ----------------------------------------------------------------------------
create or replace function public.notify_payment_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member record;
  v_cycle record;
  v_owner record;
begin
  begin
    if new.deleted_at is not null then
      return new;
    end if;

    select user_id into v_member from public.school_members where id = new.school_member_id;
    if v_member.user_id is null then
      return new;
    end if;

    select school_id, period_start, period_end
      into v_cycle
      from public.payment_cycles where id = new.payment_cycle_id;
    select * into v_owner from public.school_owner(v_cycle.school_id);

    perform public.notify(
      v_member.user_id,
      'payment_created',
      jsonb_build_object(
        'amount', new.amount,
        'currency', new.currency,
        'periodStart', v_cycle.period_start,
        'periodEnd', v_cycle.period_end,
        'paymentCycleId', new.payment_cycle_id
      ),
      'payment_record',
      new.id,
      v_owner.organization_id,
      v_cycle.school_id
    );
  exception when others then
    raise warning 'notify_payment_created failed for payment record %: %', new.id, sqlerrm;
  end;
  return new;
end;
$$;

create trigger on_payment_records_notify_created
  after insert on public.payment_records
  for each row execute procedure public.notify_payment_created();
