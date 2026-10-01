-- Notification generation triggers (N1–N5), recipient resolution, the
-- never-notify-the-actor rule and idempotency.
begin;

-- Fixture: owner O with organization + school, student S (account), offline member F.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.local'),
  ('00000000-0000-0000-0000-0000000000b1', 'student@test.local'),
  ('00000000-0000-0000-0000-0000000000c1', 'applicant@test.local');

insert into public.organizations (id, owner_id, name) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Dojo Org');

insert into public.schools (id, organization_id, name) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Dojo Kraków');

insert into public.school_members (id, school_id, user_id, display_name, status) values
  ('40000000-0000-0000-0000-0000000000b1', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b1', 'Ola Student', 'active'),
  ('40000000-0000-0000-0000-0000000000f1', '30000000-0000-0000-0000-000000000001', null, 'Offline Kid', 'offline');

insert into public.events (id, organization_id, school_id, name, start_date, end_date, visibility, created_by) values
  ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Summer Camp', '2026-07-01', '2026-07-05', 'organization', '00000000-0000-0000-0000-0000000000a1'),
  ('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Winter Cup', '2026-12-01', '2026-12-01', 'whitelist', '00000000-0000-0000-0000-0000000000a1');

insert into public.payment_cycles (id, school_id, period_start, period_end) values
  ('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '2026-10-01', '2026-10-31');

create temp view owner_inbox as
  select * from public.notifications where recipient_id = '00000000-0000-0000-0000-0000000000a1';
create temp view student_inbox as
  select * from public.notifications where recipient_id = '00000000-0000-0000-0000-0000000000b1';

-- ---------------------------------------------------------------------------
-- N1: a student's order notifies the owner once; item count follows the items.
-- ---------------------------------------------------------------------------
set local request.headers = '{"x-evolync-actor": "00000000-0000-0000-0000-0000000000b1"}';

insert into public.orders (id, school_id, school_member_id) values
  ('70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-0000000000b1');

do $$ begin
  assert (select count(*) from owner_inbox where type = 'order_created') = 1, 'N1: owner should get one order notification';
  assert (select payload ->> 'studentName' from owner_inbox where type = 'order_created') = 'Ola Student', 'N1: payload carries student name';
  assert (select organization_id from owner_inbox where type = 'order_created') = '20000000-0000-0000-0000-000000000001', 'N1: organization scoped';
end $$;

insert into public.products (id, organization_id, name) values
  ('80000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Gi');
insert into public.product_variants (id, product_id, name, price) values
  ('81000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', 'A2', 100);
insert into public.order_items (order_id, product_variant_id, quantity, unit_price) values
  ('70000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', 2, 100),
  ('70000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', 1, 100);

do $$ begin
  assert (select (payload ->> 'itemCount')::int from owner_inbox where type = 'order_created') = 3, 'N1: item count refreshed from order items';
end $$;

-- Re-pushing the same order (sync upsert) does not duplicate.
insert into public.orders (id, school_id, school_member_id) values
  ('70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-0000000000b1')
  on conflict (id) do update set status = excluded.status;

do $$ begin
  assert (select count(*) from owner_inbox where type = 'order_created') = 1, 'N1: upsert of existing order must not duplicate';
end $$;

-- Owner placing an order for the student is the actor → no notification to the owner.
set local request.headers = '{"x-evolync-actor": "00000000-0000-0000-0000-0000000000a1"}';
insert into public.orders (id, school_id, school_member_id) values
  ('70000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-0000000000b1');

do $$ begin
  assert (select count(*) from owner_inbox where entity_id = '70000000-0000-0000-0000-000000000002') = 0, 'N1: actor (owner) is never notified';
end $$;

-- ---------------------------------------------------------------------------
-- N2: a join request notifies the owner.
-- ---------------------------------------------------------------------------
set local request.headers = '{"x-evolync-actor": "00000000-0000-0000-0000-0000000000c1"}';
insert into public.school_join_requests (id, school_id, user_id, display_name, email) values
  ('90000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c1', 'New Applicant', 'applicant@test.local');

do $$ begin
  assert (select count(*) from owner_inbox where type = 'join_request_created') = 1, 'N2: owner should get one join request notification';
  assert (select payload ->> 'schoolName' from owner_inbox where type = 'join_request_created') = 'Dojo Kraków', 'N2: payload carries school name';
end $$;

-- ---------------------------------------------------------------------------
-- N5: instructor adds the student to a whitelist event → student notified.
-- ---------------------------------------------------------------------------
set local request.headers = '{"x-evolync-actor": "00000000-0000-0000-0000-0000000000a1"}';
insert into public.event_participants (id, event_id, school_member_id, status, status_changed_by) values
  ('a0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-0000000000b1', 'absent', '00000000-0000-0000-0000-0000000000a1');

do $$ begin
  assert (select count(*) from student_inbox where type = 'event_assigned') = 1, 'N5: student should be notified about assignment';
  assert (select payload ->> 'eventName' from student_inbox where type = 'event_assigned') = 'Winter Cup', 'N5: payload carries event name';
  assert (select count(*) from owner_inbox where type = 'event_rsvp_attending') = 0, 'N5: assignment is not an RSVP';
end $$;

-- Instructor marking the student attending → no N3 (owner is the actor).
update public.event_participants
   set status = 'attending', status_changed_by = '00000000-0000-0000-0000-0000000000a1'
 where id = 'a0000000-0000-0000-0000-000000000001';

do $$ begin
  assert (select count(*) from owner_inbox where type = 'event_rsvp_attending') = 0, 'N3: instructor RSVP must not notify the owner';
end $$;

-- ---------------------------------------------------------------------------
-- N3: student RSVPs attending → owner notified; flip back and forth → one row, unread again.
-- ---------------------------------------------------------------------------
set local request.headers = '{"x-evolync-actor": "00000000-0000-0000-0000-0000000000b1"}';
insert into public.event_participants (id, event_id, school_member_id, status, status_changed_by) values
  ('a0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-0000000000b1', 'attending', '00000000-0000-0000-0000-0000000000b1');

do $$ begin
  assert (select count(*) from owner_inbox where type = 'event_rsvp_attending') = 1, 'N3: owner should be notified about the RSVP';
  assert (select count(*) from student_inbox where entity_id = 'a0000000-0000-0000-0000-000000000002') = 0, 'N5: self-RSVP is not an assignment';
end $$;

update public.notifications set read_at = now() where type = 'event_rsvp_attending';
update public.event_participants set status = 'absent' where id = 'a0000000-0000-0000-0000-000000000002';
update public.event_participants set status = 'attending' where id = 'a0000000-0000-0000-0000-000000000002';

do $$ begin
  assert (select count(*) from owner_inbox where type = 'event_rsvp_attending') = 1, 'N3: re-RSVP must not duplicate';
  assert (select read_at is null from owner_inbox where type = 'event_rsvp_attending'), 'N3: re-RSVP resurfaces as unread';
end $$;

-- ---------------------------------------------------------------------------
-- N4: payment record notifies the student; offline member → nobody.
-- ---------------------------------------------------------------------------
set local request.headers = '{"x-evolync-actor": "00000000-0000-0000-0000-0000000000a1"}';
insert into public.payment_records (id, payment_cycle_id, school_member_id, amount, currency) values
  ('b0000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-0000000000b1', 150, 'PLN'),
  ('b0000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-0000000000f1', 150, 'PLN');

do $$ begin
  assert (select count(*) from student_inbox where type = 'payment_created') = 1, 'N4: student should get the payment notification';
  assert (select payload ->> 'periodStart' from student_inbox where type = 'payment_created') = '2026-10-01', 'N4: payload carries the period';
  assert (select count(*) from public.notifications where entity_id = 'b0000000-0000-0000-0000-000000000002') = 0, 'N4: offline member has no recipient';
end $$;

-- ---------------------------------------------------------------------------
-- A broken notification must never roll back the source write.
-- ---------------------------------------------------------------------------
alter table public.notifications add constraint test_block_inserts check (type <> 'payment_created') not valid;
insert into public.payment_cycles (id, school_id, period_start, period_end) values
  ('60000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '2026-11-01', '2026-11-30');
insert into public.payment_records (id, payment_cycle_id, school_member_id, amount) values
  ('b0000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-0000000000b1', 10);

do $$ begin
  assert exists (select 1 from public.payment_records where id = 'b0000000-0000-0000-0000-000000000004'),
    'source write must survive a notification failure';
  assert not exists (select 1 from public.notifications where entity_id = 'b0000000-0000-0000-0000-000000000004'),
    'failed notification is skipped';
end $$;

rollback;
