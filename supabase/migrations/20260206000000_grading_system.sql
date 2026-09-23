-- ============================================================================
-- Migration: Organization Grading System
-- Description: Adds grading/ranking system for students (belts, levels, etc.)
-- ============================================================================

-- 1. Create organization_gradings table (1:N with organizations)
-- Each row represents one rank/grade (e.g., "White Belt", "1 kyu")
create table public.organization_gradings (
  id uuid not null default gen_random_uuid() primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  "order" integer not null,
  color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- 2. Enable RLS
alter table public.organization_gradings enable row level security;

-- 3. Auto-update trigger
create trigger on_organization_gradings_updated
  before update on public.organization_gradings
  for each row execute procedure public.handle_updated_at();

-- 4. Indexes
create index idx_organization_gradings_organization_id on public.organization_gradings(organization_id);
create index idx_organization_gradings_updated_at on public.organization_gradings(updated_at);

-- 5. RLS policy (org owner only)
create policy "Org owner can manage gradings"
  on public.organization_gradings for all
  to authenticated
  using (public.is_org_owner(organization_id))
  with check (public.is_org_owner(organization_id));

-- 6. Add current_rank_id to school_members
alter table public.school_members
  add column current_rank_id uuid;
