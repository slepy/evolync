-- RLS for planned trainings: the owner manages everything; a member sees
-- organization trainings, their own school's trainings and whitelist trainings
-- they are invited to — never another school's or someone else's private ones.
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a0', 'owner@test.local'),
  ('00000000-0000-0000-0000-0000000000a1', 'student-a@test.local'),
  ('00000000-0000-0000-0000-0000000000b1', 'student-b@test.local'),
  ('00000000-0000-0000-0000-0000000000c1', 'outsider@test.local');

insert into public.organizations (id, owner_id, name) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a0', 'Org');

insert into public.schools (id, organization_id, name, address) values
  ('30000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-000000000001', 'School A', 'Main St 1'),
  ('30000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-000000000001', 'School B', null);

insert into public.school_members (id, school_id, user_id, display_name) values
  ('40000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a1', 'Student A'),
  ('40000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000b1', 'Student B');

insert into public.trainings (id, organization_id, school_id, name, date, start_time, end_time, visibility, created_by) values
  ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', null, 'Org training', '2099-01-05', '18:00', '19:30', 'organization', '00000000-0000-0000-0000-0000000000a0'),
  ('50000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000000a', 'School A training', '2099-01-06', '18:00', '19:30', 'school', '00000000-0000-0000-0000-0000000000a0'),
  ('50000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-00000000000b', 'School B training', '2099-01-07', '18:00', '19:30', 'school', '00000000-0000-0000-0000-0000000000a0'),
  ('50000000-0000-0000-0000-0000000000f1', '20000000-0000-0000-0000-000000000001', null, 'Private for B', '2099-01-08', '10:00', '11:00', 'whitelist', '00000000-0000-0000-0000-0000000000a0');

insert into public.training_invitees (training_id, school_member_id) values
  ('50000000-0000-0000-0000-0000000000f1', '40000000-0000-0000-0000-00000000000b');

-- Check constraints
do $$
begin
  insert into public.trainings (organization_id, name, date, start_time, end_time, visibility, created_by)
  values ('20000000-0000-0000-0000-000000000001', 'No school', '2099-01-05', '18:00', '19:00', 'school', '00000000-0000-0000-0000-0000000000a0');
  raise exception 'school visibility without school_id should fail';
exception when check_violation then null;
end $$;

do $$
begin
  insert into public.trainings (organization_id, name, date, start_time, end_time, created_by)
  values ('20000000-0000-0000-0000-000000000001', 'Backwards', '2099-01-05', '19:00', '18:00', '00000000-0000-0000-0000-0000000000a0');
  raise exception 'end_time before start_time should fail';
exception when check_violation then null;
end $$;

do $$
begin
  insert into public.training_series (organization_id, name, start_date, end_date, rules, created_by)
  values ('20000000-0000-0000-0000-000000000001', 'Too long', '2099-01-01', '2099-08-01', '[]', '00000000-0000-0000-0000-0000000000a0');
  raise exception 'series longer than 6 months should fail';
exception when check_violation then null;
end $$;

do $$
begin
  insert into public.training_series (organization_id, name, start_date, end_date, rules, created_by)
  values ('20000000-0000-0000-0000-000000000001', 'Bad rules', '2099-01-01', '2099-02-01', '{}', '00000000-0000-0000-0000-0000000000a0');
  raise exception 'non-array rules should fail';
exception when check_violation then null;
end $$;

-- A school and member of another organization (for scoping checks)
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000d0', 'other-owner@test.local');
insert into public.organizations (id, owner_id, name) values
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000d0', 'Other org');
insert into public.schools (id, organization_id, name) values
  ('30000000-0000-0000-0000-0000000000ff', '20000000-0000-0000-0000-000000000002', 'Foreign school');
insert into public.school_members (id, school_id, display_name) values
  ('40000000-0000-0000-0000-0000000000ff', '30000000-0000-0000-0000-0000000000ff', 'Foreign member');

-- Owner: full CRUD
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a0';

do $$
begin
  assert (select count(*) from public.trainings) = 4, 'owner sees all trainings';
  assert (select count(*) from public.training_invitees) = 1, 'owner sees invitees';
end $$;

insert into public.training_series (id, organization_id, name, start_date, end_date, rules, created_by)
values ('60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Weekly', '2099-01-01', '2099-03-01',
        '[{"weekday":1,"frequency":"weekly","startTime":"18:00","endTime":"19:00"}]', '00000000-0000-0000-0000-0000000000a0');
insert into public.trainings (id, organization_id, series_id, name, date, start_time, end_time, created_by)
values ('50000000-0000-0000-0000-000000000099', '20000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001',
        'Weekly', '2099-01-05', '18:00', '19:00', '00000000-0000-0000-0000-0000000000a0');
update public.trainings set status = 'cancelled' where id = '50000000-0000-0000-0000-000000000099';
delete from public.trainings where id = '50000000-0000-0000-0000-000000000099';

-- Owner cannot point a training at another organization's school ...
do $$
begin
  insert into public.trainings (organization_id, school_id, name, date, start_time, end_time, visibility, created_by)
  values ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-0000000000ff', 'Foreign school', '2099-01-05', '18:00', '19:00', 'school', '00000000-0000-0000-0000-0000000000a0');
  raise exception 'foreign school should be denied';
exception when insufficient_privilege then null;
end $$;

-- ... nor invite another organization's member.
do $$
begin
  insert into public.training_invitees (training_id, school_member_id)
  values ('50000000-0000-0000-0000-0000000000f1', '40000000-0000-0000-0000-0000000000ff');
  raise exception 'foreign member invite should be denied';
exception when insufficient_privilege then null;
end $$;

insert into public.training_invitees (training_id, school_member_id)
values ('50000000-0000-0000-0000-0000000000f1', '40000000-0000-0000-0000-00000000000a');
delete from public.training_invitees
where training_id = '50000000-0000-0000-0000-0000000000f1' and school_member_id = '40000000-0000-0000-0000-00000000000a';

-- Student A (school A): org + school A, not school B nor B's private training
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';

do $$
declare
  names text[];
begin
  select array_agg(name order by name) into names from public.trainings;
  assert names = array['Org training', 'School A training'],
    format('student A saw %s', names);
  assert (select count(*) from public.training_invitees) = 0, 'student A sees no invitations';
  assert (select count(*) from public.training_series) = 0, 'students do not see series';
end $$;

do $$
begin
  insert into public.trainings (organization_id, name, date, start_time, end_time, created_by)
  values ('20000000-0000-0000-0000-000000000001', 'Forged', '2099-01-05', '18:00', '19:00', '00000000-0000-0000-0000-0000000000a1');
  raise exception 'student insert should be denied';
exception when insufficient_privilege then null;
end $$;

update public.trainings set name = 'Hacked';

-- Student B (school B, invited): org + school B + private
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';

do $$
declare
  names text[];
begin
  select array_agg(name order by name) into names from public.trainings;
  assert names = array['Org training', 'Private for B', 'School B training'],
    format('student B saw %s', names);
  assert (select count(*) from public.training_invitees) = 1, 'student B sees own invitation';
end $$;

-- Outsider: nothing
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c1';

do $$
begin
  assert (select count(*) from public.trainings) = 0, 'outsider sees no trainings';
end $$;

reset role;

do $$
begin
  assert not exists (select 1 from public.trainings where name = 'Hacked'), 'student update must not apply';
end $$;

rollback;
