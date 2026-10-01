-- ============================================================================
-- Push delivery webhook (spec: .ai/specs/2026-10-01-notifications-module.md)
--
-- Every new notification is handed to the send-push Edge Function through
-- pg_net (asynchronous: queued in this transaction, sent after commit, dropped
-- on rollback). The function URL and shared secret live in Supabase Vault:
--
--   select vault.create_secret('https://<project>.supabase.co/functions/v1/send-push', 'send_push_url');
--   select vault.create_secret('<same value as the SEND_PUSH_SECRET function secret>', 'send_push_secret');
--
-- Until both secrets exist (or where pg_net/Vault are unavailable, e.g. local
-- tests) the trigger does nothing; the inbox works without push.
-- ============================================================================

do $$
begin
  create extension if not exists pg_net with schema extensions;
exception when others then
  raise notice 'pg_net not available (%): push webhook stays inactive', sqlerrm;
end $$;

create or replace function public.dispatch_notification_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
  v_secret text;
begin
  begin
    if to_regnamespace('net') is null or to_regclass('vault.decrypted_secrets') is null then
      return new;
    end if;

    select decrypted_secret into v_url from vault.decrypted_secrets where name = 'send_push_url';
    select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'send_push_secret';
    if v_url is null or v_secret is null then
      return new;
    end if;

    -- Same body shape as a Supabase Database Webhook.
    perform net.http_post(
      url := v_url,
      body := jsonb_build_object(
        'type', 'INSERT',
        'table', 'notifications',
        'schema', 'public',
        'record', to_jsonb(new),
        'old_record', null
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-send-push-secret', v_secret
      ),
      timeout_milliseconds := 5000
    );
  exception when others then
    raise warning 'dispatch_notification_push failed for notification %: %', new.id, sqlerrm;
  end;
  return new;
end;
$$;

revoke execute on function public.dispatch_notification_push() from public, anon, authenticated;

create trigger on_notifications_dispatch_push
  after insert on public.notifications
  for each row execute procedure public.dispatch_notification_push();
