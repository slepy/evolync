/*
  Migration: School Settings
  Date: 2026-01-23
  Description: Creates school_settings table for payment defaults (1:1 with schools)

  Fields:
  - default_currency: Default currency for payments (e.g., PLN, EUR, USD)
  - default_payment_amount: Default monthly payment amount
*/

-- 1. Create school_settings table
-- -----------------------------------------------------------------------------

create table public.school_settings (
  id uuid not null default gen_random_uuid() primary key,
  school_id uuid not null references public.schools(id) on delete cascade,
  default_currency text default 'PLN',
  default_payment_amount numeric(10,2) default 0 check (default_payment_amount >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,

  -- Ensure 1:1 relationship with schools
  constraint unique_school_settings unique (school_id)
);

alter table public.school_settings enable row level security;

create trigger on_school_settings_updated
  before update on public.school_settings
  for each row execute procedure public.handle_updated_at();

-- 2. Indexes
-- -----------------------------------------------------------------------------

-- Foreign key index
create index idx_school_settings_school_id on public.school_settings(school_id);

-- WatermelonDB sync index
create index idx_school_settings_updated_at on public.school_settings(updated_at);

-- 3. Row Level Security Policies
-- -----------------------------------------------------------------------------

-- Only org owner can manage school settings
create policy "Org owner can manage school settings"
  on public.school_settings for all
  to authenticated
  using (public.is_school_owner(school_id))
  with check (public.is_school_owner(school_id));
