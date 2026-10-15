/*
  Migration: Drop the one-off amount of a payment period
  Date: 2026-10-16
  Description: Reverts 20261015000200. A period's one-off amount is written
  only to its payment_records; the period itself keeps no amount. A member
  added to the period later pays their own fee or the school default (the
  instructor can edit that payment). No data is lost: every record already
  holds its amount and currency.
*/

alter table public.payment_cycles
  drop constraint if exists payment_cycles_amount_check;

alter table public.payment_cycles
  drop column if exists amount,
  drop column if exists currency;
