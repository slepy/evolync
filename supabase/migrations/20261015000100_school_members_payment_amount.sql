/*
  Migration: Own payment amount of a school member
  Date: 2026-10-15
  Description: An instructor can set a member's own fee (e.g. half the amount
  for a child) on the student details screen. New payment periods use it
  instead of the school's default amount. Both columns empty = school default.
  Only the instructor's sync writes them; the student sync strips them.
*/

alter table public.school_members
  add column if not exists payment_amount numeric(10, 2),
  add column if not exists payment_currency text;

alter table public.school_members
  drop constraint if exists school_members_payment_amount_check;

alter table public.school_members
  add constraint school_members_payment_amount_check check (
    (payment_amount is null and payment_currency is null)
    or (payment_amount >= 0 and payment_currency is not null)
  );
