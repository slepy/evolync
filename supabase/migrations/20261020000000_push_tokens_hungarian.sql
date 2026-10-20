-- ============================================================================
-- Push tokens: Hungarian push text.
--
-- The app gained a Hungarian translation; devices using it register with
-- locale 'hu' so send-push renders Hungarian text. Deploy the send-push
-- function first: an older function falls back to English for 'hu'.
-- ============================================================================

alter table public.push_tokens drop constraint if exists push_tokens_locale_check;
alter table public.push_tokens
  add constraint push_tokens_locale_check check (locale in ('en', 'pl', 'hu'));

create or replace function public.register_push_token(p_token text, p_platform text, p_locale text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_locale text := case
    when lower(coalesce(p_locale, '')) like 'pl%' then 'pl'
    when lower(coalesce(p_locale, '')) like 'hu%' then 'hu'
    else 'en'
  end;
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
