-- Fix ambiguous column reference in is_member_of_school function
-- The parameter name 'school_id' conflicted with the column name 'school_id' in school_members table

create or replace function public.is_member_of_school(check_school_id uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from public.school_members sm
    where sm.school_id = check_school_id
    and sm.user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Re-apply the policy using the new parameter name (function signature is same types, but good to ensure everything matches)
-- Note: Function body update is sufficient as the name 'is_member_of_school' persists.
