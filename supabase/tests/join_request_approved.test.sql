-- N6: approving a join request notifies the student — both approval modes
-- (new member, activated offline member); members that never asked to join
-- and repeated writes of an active member do not.
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.local'),
  ('00000000-0000-0000-0000-0000000000b1', 'new@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'offline@test.local'),
  ('00000000-0000-0000-0000-0000000000b3', 'noreq@test.local');

insert into public.organizations (id, owner_id, name) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Dojo Org');
insert into public.schools (id, organization_id, name) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Dojo Kraków');

insert into public.school_join_requests (id, school_id, user_id, display_name, email) values
  ('90000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b1', 'New Kid', 'new@test.local'),
  ('90000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b2', 'Offline Kid', 'offline@test.local');

insert into public.school_members (id, school_id, user_id, display_name, status) values
  ('40000000-0000-0000-0000-0000000000f2', '30000000-0000-0000-0000-000000000001', null, 'Offline Kid', 'offline');

create temp view approvals as
  select * from public.notifications where type = 'join_request_approved';

-- The owner approves (sync forwards the owner as the actor).
set local request.headers = '{"x-evolync-actor": "00000000-0000-0000-0000-0000000000a1"}';

-- Mode "new": a new active member for the requester.
insert into public.school_members (id, school_id, user_id, display_name, status) values
  ('40000000-0000-0000-0000-0000000000b1', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b1', 'New Kid', 'active');
update public.school_join_requests set deleted_at = now() where id = '90000000-0000-0000-0000-000000000001';

do $$ begin
  assert (select count(*) from approvals where recipient_id = '00000000-0000-0000-0000-0000000000b1') = 1,
    'N6: new member gets one approval notification';
  assert (select payload ->> 'schoolName' from approvals where recipient_id = '00000000-0000-0000-0000-0000000000b1') = 'Dojo Kraków',
    'N6: payload carries school name';
  assert (select school_id from approvals where recipient_id = '00000000-0000-0000-0000-0000000000b1') = '30000000-0000-0000-0000-000000000001',
    'N6: school scoped';
  assert (select organization_id from approvals where recipient_id = '00000000-0000-0000-0000-0000000000b1') = '20000000-0000-0000-0000-000000000001',
    'N6: organization scoped';
  assert (select count(*) from public.notifications where recipient_id = '00000000-0000-0000-0000-0000000000a1' and type = 'join_request_approved') = 0,
    'N6: the approving owner is not notified';
end $$;

-- Mode "existing": the offline member is linked to the requester and activated.
update public.school_members
   set user_id = '00000000-0000-0000-0000-0000000000b2', status = 'active'
 where id = '40000000-0000-0000-0000-0000000000f2';

do $$ begin
  assert (select count(*) from approvals where recipient_id = '00000000-0000-0000-0000-0000000000b2') = 1,
    'N6: activated offline member gets one approval notification';
  assert (select entity_id from approvals where recipient_id = '00000000-0000-0000-0000-0000000000b2') = '40000000-0000-0000-0000-0000000000f2',
    'N6: entity is the member row';
end $$;

-- Later updates of an active member (profile, re-pushed sync batch) do not notify again.
update public.school_members set display_name = 'New Kid 2', status = 'active'
 where id = '40000000-0000-0000-0000-0000000000b1';

do $$ begin
  assert (select count(*) from approvals) = 2, 'N6: updates of an active member never re-notify';
end $$;

-- An active member with an account but without a join request is not an approval.
insert into public.school_members (id, school_id, user_id, display_name, status) values
  ('40000000-0000-0000-0000-0000000000b3', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b3', 'No Request', 'active');

do $$ begin
  assert (select count(*) from approvals where recipient_id = '00000000-0000-0000-0000-0000000000b3') = 0,
    'N6: no join request → no approval notification';
end $$;

rollback;
