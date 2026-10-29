-- Join requests store their status, and only a pending request blocks another
-- one for the same user and school.
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000c1', 'owner@test.local'),
  ('00000000-0000-0000-0000-0000000000c2', 'student@test.local');
insert into public.organizations (id, owner_id, name)
values ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000c1', 'Org');
insert into public.schools (id, organization_id, name)
values ('00000000-0000-0000-0000-0000000000c4', '00000000-0000-0000-0000-0000000000c3', 'School');

-- A request without a status (old clients) is pending.
insert into public.school_join_requests (id, school_id, user_id, display_name, email)
values ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c4',
        '00000000-0000-0000-0000-0000000000c2', 'Student', 'student@test.local');
do $$ begin
  assert (select status from public.school_join_requests where id = '00000000-0000-0000-0000-0000000000d1') = 'pending',
    'status defaults to pending';
end $$;

-- A second pending request for the same school is refused.
do $$ begin
  begin
    insert into public.school_join_requests (school_id, user_id, display_name, email, status)
    values ('00000000-0000-0000-0000-0000000000c4', '00000000-0000-0000-0000-0000000000c2', 'Student', 'student@test.local', 'pending');
    raise exception 'a second pending request was accepted';
  exception when unique_violation then
    null;
  end;
end $$;

-- Once rejected, the student can send a new request.
update public.school_join_requests set status = 'rejected' where id = '00000000-0000-0000-0000-0000000000d1';
insert into public.school_join_requests (id, school_id, user_id, display_name, email, status)
values ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000c4',
        '00000000-0000-0000-0000-0000000000c2', 'Student', 'student@test.local', 'pending');

-- Approved requests are soft-deleted; they do not block a later request either.
update public.school_join_requests set deleted_at = now() where id = '00000000-0000-0000-0000-0000000000d2';
insert into public.school_join_requests (school_id, user_id, display_name, email, status)
values ('00000000-0000-0000-0000-0000000000c4', '00000000-0000-0000-0000-0000000000c2', 'Student', 'student@test.local', 'pending');

-- Only pending and rejected are valid.
do $$ begin
  begin
    update public.school_join_requests set status = 'approved' where id = '00000000-0000-0000-0000-0000000000d1';
    raise exception 'an unknown status was accepted';
  exception when check_violation then
    null;
  end;
end $$;

rollback;
