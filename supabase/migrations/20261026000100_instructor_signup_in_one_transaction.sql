-- ============================================================================
-- Instructor sign-up in one transaction
--
-- The app created the account (auth.signUp) and then the organization
-- (rpc setup_instructor_organization) in two calls. When the second failed,
-- an account without an organization remained: a retry reported the e-mail
-- as taken and signing in opened the student dashboard. Meanwhile this
-- trigger did nothing, because the app stopped sending the names in the
-- sign-up metadata.
--
-- The app now sends organization_name / school_name as sign-up metadata and
-- this trigger creates the organization, its default roles and the first
-- school inside the auth.users insert: any failure rolls back the account
-- too, so sign-up either fully succeeds or leaves nothing behind.
-- setup_instructor_organization stays for accounts already left without an
-- organization (the app completes them on the next sign-up attempt).
-- ============================================================================

create or replace function public.handle_new_user_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_name text := nullif(btrim(new.raw_user_meta_data ->> 'organization_name'), '');
  v_school_name text := nullif(btrim(new.raw_user_meta_data ->> 'school_name'), '');
  v_organization_id uuid;
begin
  -- Student sign-up and OAuth carry no organization: nothing to create.
  if v_organization_name is null or v_school_name is null then
    return new;
  end if;

  insert into public.organizations (owner_id, name)
  values (new.id, v_organization_name)
  returning id into v_organization_id;

  insert into public.organization_roles (organization_id, name, is_system_default)
  values
    (v_organization_id, 'Owner', true),
    (v_organization_id, 'Instructor', true),
    (v_organization_id, 'Student', true);

  insert into public.schools (organization_id, name)
  values (v_organization_id, v_school_name);

  -- No exception handler: an error aborts the auth.users insert as well.
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_signup();

grant execute on function public.handle_new_user_signup() to supabase_auth_admin;

comment on function public.handle_new_user_signup() is
'Creates the organization, default roles and first school when an instructor signs up (organization_name and school_name in the sign-up metadata), in the same transaction as the account.';
