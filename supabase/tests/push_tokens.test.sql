-- push_tokens RPCs: registration upserts by token and follows the signed-in
-- user; only the owner can disable; anonymous callers are refused.
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'a@test.local'),
  ('00000000-0000-0000-0000-0000000000b1', 'b@test.local');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';

select public.register_push_token('ExponentPushToken[device-1]', 'ios', 'pl-PL');
select public.register_push_token('ExponentPushToken[device-1]', 'ios', 'pl-PL');

do $$ begin
  assert (select count(*) from public.push_tokens) = 1, 're-registering is idempotent';
  assert (select locale from public.push_tokens) = 'pl', 'locale normalized to pl';
end $$;

-- User B cannot see or disable A's token.
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
select public.disable_push_token('ExponentPushToken[device-1]');
do $$ begin
  assert (select count(*) from public.push_tokens) = 0, 'B cannot read A''s tokens';
end $$;

reset role;
do $$ begin
  assert (select enabled from public.push_tokens where token = 'ExponentPushToken[device-1]'),
    'a non-owner cannot disable the token';
end $$;

-- Same device, B signs in: the token moves to B.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
select public.register_push_token('ExponentPushToken[device-1]', 'android', 'en-US');
reset role;
do $$ begin
  assert (select user_id from public.push_tokens where token = 'ExponentPushToken[device-1]')
    = '00000000-0000-0000-0000-0000000000b1', 'token follows the signed-in user';
  assert (select locale from public.push_tokens where token = 'ExponentPushToken[device-1]') = 'en',
    'other locales fall back to en';
end $$;

-- B logs out: token disabled.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
select public.disable_push_token('ExponentPushToken[device-1]');
reset role;
do $$ begin
  assert not (select enabled from public.push_tokens where token = 'ExponentPushToken[device-1]'),
    'owner disables the token';
end $$;

-- Anonymous callers are refused.
set local role anon;
do $$
begin
  perform public.register_push_token('ExponentPushToken[device-2]', 'ios', 'en');
  raise exception 'anon should not be able to register';
exception when insufficient_privilege then
  null;
end $$;
reset role;

rollback;
