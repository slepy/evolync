/*
  Migration: One-off amount of a payment period
  Date: 2026-10-15
  Description: A new period can have one amount for everyone (e.g. a yearly
  fee in another currency). It is kept on the period so a student approved
  into it later pays the same amount. Both columns empty = each member's own
  fee or the school default.
*/

alter table public.payment_cycles
  add column if not exists amount numeric(10, 2),
  add column if not exists currency text;

alter table public.payment_cycles
  drop constraint if exists payment_cycles_amount_check;

alter table public.payment_cycles
  add constraint payment_cycles_amount_check check (
    (amount is null and currency is null)
    or (amount >= 0 and currency is not null)
  );
