-- The notifications insert trigger hands each new row to send-push via
-- pg_net with the Vault secret, stays inert without configuration, and never
-- blocks the insert when the HTTP call fails.
begin;

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000b1', 'student@test.local');

-- Without pg_net/Vault (plain Postgres): insert succeeds, nothing dispatched.
insert into public.notifications (recipient_id, type, entity_type, entity_id)
values ('00000000-0000-0000-0000-0000000000b1', 'payment_created', 'payment_record', gen_random_uuid());

-- Stand-ins for pg_net and Vault, recording calls.
create schema net;
create table net.calls (url text, body jsonb, headers jsonb);
create function net.http_post(url text, body jsonb, headers jsonb, timeout_milliseconds int)
returns bigint language sql as $$
  insert into net.calls values (url, body, headers);
  select 1::bigint;
$$;
create schema vault;
create table vault.decrypted_secrets (name text, decrypted_secret text);

-- Configured pg_net but no secrets yet → still inert.
insert into public.notifications (recipient_id, type, entity_type, entity_id)
values ('00000000-0000-0000-0000-0000000000b1', 'payment_created', 'payment_record', gen_random_uuid());
do $$ begin
  assert (select count(*) from net.calls) = 0, 'no dispatch without Vault secrets';
end $$;

insert into vault.decrypted_secrets values
  ('send_push_url', 'https://example.supabase.co/functions/v1/send-push'),
  ('send_push_secret', 'shh');

insert into public.notifications (id, recipient_id, type, entity_type, entity_id)
values ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b1', 'event_assigned', 'event_participant', gen_random_uuid());

do $$ begin
  assert (select count(*) from net.calls) = 1, 'one dispatch per insert';
  assert (select url from net.calls) = 'https://example.supabase.co/functions/v1/send-push', 'posts to the configured URL';
  assert (select headers ->> 'x-send-push-secret' from net.calls) = 'shh', 'sends the shared secret';
  assert (select body #>> '{record,id}' from net.calls) = 'c0000000-0000-0000-0000-000000000001', 'carries the new row';
  assert (select body ->> 'type' from net.calls) = 'INSERT', 'webhook body shape';
end $$;

-- Marking read (UPDATE) does not dispatch.
update public.notifications set read_at = now() where id = 'c0000000-0000-0000-0000-000000000001';
do $$ begin
  assert (select count(*) from net.calls) = 1, 'updates are not pushed';
end $$;

-- A failing HTTP call never blocks the notification insert.
create or replace function net.http_post(url text, body jsonb, headers jsonb, timeout_milliseconds int)
returns bigint language plpgsql as $$ begin raise exception 'pg_net down'; end $$;

insert into public.notifications (id, recipient_id, type, entity_type, entity_id)
values ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000b1', 'event_assigned', 'event_participant', gen_random_uuid());
do $$ begin
  assert exists (select 1 from public.notifications where id = 'c0000000-0000-0000-0000-000000000002'),
    'insert survives a dispatch failure';
end $$;

rollback;
