-- Fix access policy for function is_school_owner
-- Allow Organization OWNER access even if they are not in school_members table

create or replace function public.is_school_owner(check_school_id uuid)
returns boolean as $$
begin
  -- Only check if user is the owner of the organization that owns the school
  return exists (
    select 1
    from public.schools s
    join public.organizations o on s.organization_id = o.id
    where s.id = check_school_id
    and o.owner_id = auth.uid()
  );
end;
$$ language plpgsql security definer;
