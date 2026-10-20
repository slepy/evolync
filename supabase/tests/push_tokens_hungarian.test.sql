-- push_tokens Hungarian (20261020000000): register_push_token stores 'hu',
-- the locale check accepts it and still rejects unknown locales; the rollback
-- in the PR body (hu rows → en, en/pl check, previous function) applies cleanly.
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'a@test.local');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';

select public.register_push_token('ExponentPushToken[hu-1]', 'ios', 'hu-HU');
select public.register_push_token('ExponentPushToken[hu-2]', 'android', 'HU');
select public.register_push_token('ExponentPushToken[pl-1]', 'ios', 'pl');
select public.register_push_token('ExponentPushToken[de-1]', 'ios', 'de-DE');
reset role;

do $$ begin
  assert (select locale from public.push_tokens where token = 'ExponentPushToken[hu-1]') = 'hu',
    'hu-HU normalized to hu';
  assert (select locale from public.push_tokens where token = 'ExponentPushToken[hu-2]') = 'hu',
    'HU normalized to hu';
  assert (select locale from public.push_tokens where token = 'ExponentPushToken[pl-1]') = 'pl',
    'pl unchanged';
  assert (select locale from public.push_tokens where token = 'ExponentPushToken[de-1]') = 'en',
    'other locales fall back to en';
end $$;

-- The check constraint accepts hu and still rejects unknown locales.
insert into public.push_tokens (user_id, token, platform, locale)
values ('00000000-0000-0000-0000-0000000000a1', 'ExponentPushToken[raw-hu]', 'ios', 'hu');
do $$
begin
  insert into public.push_tokens (user_id, token, platform, locale)
  values ('00000000-0000-0000-0000-0000000000a1', 'ExponentPushToken[raw-de]', 'ios', 'de');
  raise exception 'locale de should be rejected';
exception when check_violation then
  null;
end $$;

-- Rollback (down): map hu rows to en, restore the en/pl check and the previous function.
update public.push_tokens set locale = 'en' where locale = 'hu';
alter table public.push_tokens drop constraint push_tokens_locale_check;
alter table public.push_tokens
  add constraint push_tokens_locale_check check (locale in ('en', 'pl'));

create or replace function public.register_push_token(p_token text, p_platform text, p_locale text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_locale text := case when lower(coalesce(p_locale, '')) like 'pl%' then 'pl' else 'en' end;
begin
  if v_user is null then
    raise exception 'register_push_token requires an authenticated user' using errcode = '42501';
  end if;
  if coalesce(trim(p_token), '') = '' then
    raise exception 'register_push_token requires a token' using errcode = '22023';
  end if;

  insert into public.push_tokens (user_id, token, platform, locale, enabled)
  values (v_user, p_token, p_platform, v_locale, true)
  on conflict (token) do update
    set user_id = v_user,
        platform = excluded.platform,
        locale = excluded.locale,
        enabled = true,
        deleted_at = null;
end;
$$;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select public.register_push_token('ExponentPushToken[hu-1]', 'ios', 'hu-HU');
reset role;

do $$ begin
  assert (select count(*) from public.push_tokens where locale = 'hu') = 0, 'no hu rows after rollback';
  assert (select locale from public.push_tokens where token = 'ExponentPushToken[hu-1]') = 'en',
    'after rollback hu registers as en';
  assert (select locale from public.push_tokens where token = 'ExponentPushToken[pl-1]') = 'pl',
    'pl rows survive the rollback';
end $$;

rollback;
