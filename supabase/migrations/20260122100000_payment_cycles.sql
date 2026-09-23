/*
  Migration: Payment Cycles Schema
  Date: 2026-01-22
  Description: Replaces old 'payments' table with new two-table design:
    - payment_cycles: Payment periods grouped by school + date range
    - payment_records: Individual payment per member per cycle

  This migration:
  1. Creates new payment_cycles and payment_records tables
  2. Migrates data from old payments table (skipping records with NULL period_start/period_end)
  3. Drops the old 'payments' table
*/

-- 1. Create new tables
-- -----------------------------------------------------------------------------

-- Table: payment_cycles
-- Represents a billing period for a school
create table public.payment_cycles (
  id uuid not null default gen_random_uuid() primary key,
  school_id uuid not null references public.schools(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,

  -- Ensure period_end is after or equal to period_start
  constraint payment_cycles_period_check check (period_end >= period_start),
  -- Ensure unique cycle per school per period
  constraint unique_school_period unique (school_id, period_start, period_end)
);

alter table public.payment_cycles enable row level security;

create trigger on_payment_cycles_updated
  before update on public.payment_cycles
  for each row execute procedure public.handle_updated_at();

-- Table: payment_records
-- Individual payment record for a member in a specific cycle
create table public.payment_records (
  id uuid not null default gen_random_uuid() primary key,
  payment_cycle_id uuid not null references public.payment_cycles(id) on delete cascade,
  school_member_id uuid not null references public.school_members(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 0),
  currency text default 'PLN',
  status public.payment_status default 'pending',
  method public.payment_method default 'cash',
  payment_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,

  -- Ensure one record per member per cycle
  constraint unique_member_cycle unique (payment_cycle_id, school_member_id)
);

alter table public.payment_records enable row level security;

create trigger on_payment_records_updated
  before update on public.payment_records
  for each row execute procedure public.handle_updated_at();

-- 2. Migrate data from old payments table
-- -----------------------------------------------------------------------------

-- First, create payment_cycles from distinct periods in payments
-- (only for records with non-null period_start and period_end)
insert into public.payment_cycles (school_id, period_start, period_end, created_at, updated_at)
select distinct
  school_id,
  period_start,
  period_end,
  min(created_at) as created_at,
  max(updated_at) as updated_at
from public.payments
where period_start is not null
  and period_end is not null
group by school_id, period_start, period_end;

-- Then, create payment_records linked to the new cycles
insert into public.payment_records (
  payment_cycle_id,
  school_member_id,
  amount,
  currency,
  status,
  method,
  payment_date,
  created_at,
  updated_at,
  deleted_at
)
select
  pc.id as payment_cycle_id,
  p.school_member_id,
  p.amount,
  p.currency,
  p.status,
  p.method,
  p.payment_date,
  p.created_at,
  p.updated_at,
  p.deleted_at
from public.payments p
join public.payment_cycles pc
  on p.school_id = pc.school_id
  and p.period_start = pc.period_start
  and p.period_end = pc.period_end
where p.period_start is not null
  and p.period_end is not null;

-- 3. Remove old payments table and related objects
-- -----------------------------------------------------------------------------

drop policy if exists "Payments viewable by user or org owner" on public.payments;
drop trigger if exists on_payments_updated on public.payments;
drop index if exists idx_payments_school_id;
drop index if exists idx_payments_user_id;
drop index if exists idx_payments_updated_at;
drop index if exists idx_payments_user_period_end;
drop table public.payments;

-- 4. Indexes
-- -----------------------------------------------------------------------------

-- Foreign key indexes
create index idx_payment_cycles_school_id on public.payment_cycles(school_id);
create index idx_payment_records_cycle_id on public.payment_records(payment_cycle_id);
create index idx_payment_records_member_id on public.payment_records(school_member_id);

-- WatermelonDB sync indexes (critical for pull changes)
create index idx_payment_cycles_updated_at on public.payment_cycles(updated_at);
create index idx_payment_records_updated_at on public.payment_records(updated_at);

-- Query optimization indexes
create index idx_payment_cycles_school_period on public.payment_cycles(school_id, period_start desc, period_end desc);
create index idx_payment_records_member_status on public.payment_records(school_member_id, status);

-- 5. Row Level Security Policies
-- -----------------------------------------------------------------------------

-- Payment Cycles: Only org owner can manage
create policy "Org owner can manage payment cycles"
  on public.payment_cycles for all
  to authenticated
  using (public.is_school_owner(school_id))
  with check (public.is_school_owner(school_id));

-- Payment Cycles: Members can view cycles for their school
create policy "School members can view payment cycles"
  on public.payment_cycles for select
  to authenticated
  using (public.is_member_of_school(school_id));

-- Payment Records: Only org owner can manage
create policy "Org owner can manage payment records"
  on public.payment_records for all
  to authenticated
  using (
    exists (
      select 1 from public.payment_cycles pc
      where pc.id = payment_cycle_id
      and public.is_school_owner(pc.school_id)
    )
  )
  with check (
    exists (
      select 1 from public.payment_cycles pc
      where pc.id = payment_cycle_id
      and public.is_school_owner(pc.school_id)
    )
  );

-- Payment Records: Members can view their own payment records
create policy "Members can view own payment records"
  on public.payment_records for select
  to authenticated
  using (
    exists (
      select 1 from public.school_members sm
      where sm.id = school_member_id
      and sm.user_id = auth.uid()
    )
  );
