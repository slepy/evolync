-- Instructor sign-up: the account and its organization are created together,
-- a student sign-up creates no organization, and a failed organization setup
-- leaves no account behind.
begin;

-- Instructor: organization, default roles and the first school.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000e1', 'sensei@test.local',
   '{"full_name": "Sensei", "organization_name": "Dojo Org", "school_name": "Dojo Kraków"}');

do $$
declare
  v_org uuid;
begin
  select id into v_org from public.organizations where owner_id = '00000000-0000-0000-0000-0000000000e1';
  assert v_org is not null, 'instructor: organization created';
  assert (select name from public.organizations where id = v_org) = 'Dojo Org', 'instructor: organization name from metadata';
  assert (select count(*) from public.organization_roles where organization_id = v_org) = 3, 'instructor: default roles created';
  assert (select name from public.schools where organization_id = v_org) = 'Dojo Kraków', 'instructor: first school created';
end $$;

-- Student (and OAuth) sign-up: no organization.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000e2', 'student@test.local', '{"full_name": "Ola"}'),
  ('00000000-0000-0000-0000-0000000000e3', 'blank@test.local', '{"organization_name": " ", "school_name": "X"}');

do $$ begin
  assert (select count(*) from public.organizations
          where owner_id in ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000e3')) = 0,
    'student: no organization';
end $$;

-- A failing organization setup rolls the account back too.
alter table public.schools add constraint test_block_school check (name <> 'FAIL') not valid;

do $$
begin
  begin
    insert into auth.users (id, email, raw_user_meta_data) values
      ('00000000-0000-0000-0000-0000000000e4', 'broken@test.local',
       '{"organization_name": "Broken Org", "school_name": "FAIL"}');
    raise exception 'sign-up should have failed';
  exception when check_violation then
    null;
  end;

  assert (select count(*) from auth.users where id = '00000000-0000-0000-0000-0000000000e4') = 0,
    'failed setup: no account left behind';
  assert (select count(*) from public.organizations where owner_id = '00000000-0000-0000-0000-0000000000e4') = 0,
    'failed setup: no organization left behind';
end $$;

rollback;
