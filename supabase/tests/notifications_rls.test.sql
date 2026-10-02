-- RLS for public.notifications: recipients see only their own rows, cannot
-- insert or delete, and may change nothing but read_at.
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.local');

insert into public.notifications (id, recipient_id, type, entity_type, entity_id) values
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'payment_created', 'payment_record', gen_random_uuid()),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b', 'payment_created', 'payment_record', gen_random_uuid());

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';

do $$
declare
  visible int;
begin
  select count(*) into visible from public.notifications;
  assert visible = 1, format('student A should see 1 notification, saw %s', visible);
  assert (select recipient_id from public.notifications) = '00000000-0000-0000-0000-00000000000a',
    'student A must only see own notification';
end $$;

-- Insert is denied.
do $$
begin
  insert into public.notifications (recipient_id, type, entity_type, entity_id)
  values ('00000000-0000-0000-0000-00000000000a', 'payment_created', 'payment_record', gen_random_uuid());
  raise exception 'insert should have been denied';
exception when insufficient_privilege then
  null;
end $$;

-- Changing any column but read_at is denied.
do $$
begin
  update public.notifications set type = 'order_created'
  where id = '10000000-0000-0000-0000-00000000000a';
  raise exception 'updating type should have been denied';
exception when insufficient_privilege then
  null;
end $$;

-- Delete is denied.
do $$
begin
  delete from public.notifications where id = '10000000-0000-0000-0000-00000000000a';
  raise exception 'delete should have been denied';
exception when insufficient_privilege then
  null;
end $$;

-- notify() is trigger-only: clients cannot forge notifications for others.
do $$
begin
  perform public.notify('00000000-0000-0000-0000-00000000000b', 'payment_created', '{}'::jsonb, 'payment_record', gen_random_uuid());
  raise exception 'calling notify() should have been denied';
exception when insufficient_privilege then
  null;
end $$;

-- Marking own row read works; another user's row is untouched.
update public.notifications set read_at = now();

reset role;

do $$
begin
  assert (select read_at is not null from public.notifications where id = '10000000-0000-0000-0000-00000000000a'),
    'own notification should be marked read';
  assert (select read_at is null from public.notifications where id = '10000000-0000-0000-0000-00000000000b'),
    'other user''s notification must stay unread';
end $$;

rollback;
