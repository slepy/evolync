-- ============================================================================
-- Push tokens (spec: .ai/specs/2026-10-01-notifications-module.md, Phase 3)
--
-- A device's Expo push token is device state, not offline business data, so
-- it is not synced through WatermelonDB. Clients write it directly through
-- the register_push_token / disable_push_token RPCs.
-- ============================================================================

create table if not exists public.push_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  token       text not null unique,
  platform    text not null check (platform in ('ios', 'android')),
  -- Language push text is rendered in (captured from the device at registration).
  locale      text not null default 'en' check (locale in ('en', 'pl')),
  enabled     boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index if not exists idx_push_tokens_user_active
  on public.push_tokens (user_id)
  where enabled and deleted_at is null;

create trigger on_push_tokens_updated
  before update on public.push_tokens
  for each row execute procedure public.handle_updated_at();

alter table public.push_tokens enable row level security;

create policy "Users manage own push tokens"
  on public.push_tokens
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- register_push_token — upsert by token for the calling user. A token that
-- belonged to another account (shared device, re-login) moves to the caller.
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- disable_push_token — on logout and when the Settings switch is turned off.
-- Only the token's current owner can disable it.
-- ----------------------------------------------------------------------------
create or replace function public.disable_push_token(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.push_tokens
     set enabled = false
   where token = p_token
     and user_id = auth.uid();
end;
$$;

revoke execute on function public.register_push_token(text, text, text) from public, anon;
revoke execute on function public.disable_push_token(text) from public, anon;
grant execute on function public.register_push_token(text, text, text) to authenticated;
grant execute on function public.disable_push_token(text) to authenticated;
