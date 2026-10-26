-- ============================================================================
-- N6 — student: join request approved
--
-- "Request sent" promises the student an Alert once the school accepts them,
-- but only the owner was notified (N2). Approval writes the student's
-- school_members row — a new active member, or an offline member activated
-- with the student's user_id — so that row is the trigger source. A join
-- request for the same user and school (live or already soft-deleted by the
-- approval) tells an approval apart from other ways a member becomes active.
-- ============================================================================

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in (
  'order_created',
  'join_request_created',
  'event_rsvp_attending',
  'payment_created',
  'event_assigned',
  'join_request_approved'
));

create or replace function public.notify_join_request_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner record;
begin
  begin
    if new.deleted_at is not null or new.user_id is null or new.status is distinct from 'active' then
      return new;
    end if;

    -- Only the transition into an active account-linked member counts.
    if tg_op = 'UPDATE'
       and old.status is not distinct from 'active'
       and old.user_id is not distinct from new.user_id
       and old.deleted_at is null then
      return new;
    end if;

    if not exists (
      select 1 from public.school_join_requests
      where user_id = new.user_id and school_id = new.school_id
    ) then
      return new;
    end if;

    select * into v_owner from public.school_owner(new.school_id);

    perform public.notify(
      new.user_id,
      'join_request_approved',
      jsonb_build_object(
        'schoolName', (select name from public.schools where id = new.school_id),
        'schoolId', new.school_id
      ),
      'school_member',
      new.id,
      v_owner.organization_id,
      new.school_id
    );
  exception when others then
    raise warning 'notify_join_request_approved failed for member %: %', new.id, sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists on_school_members_notify_approved on public.school_members;
create trigger on_school_members_notify_approved
  after insert or update of status, user_id, deleted_at on public.school_members
  for each row execute procedure public.notify_join_request_approved();
