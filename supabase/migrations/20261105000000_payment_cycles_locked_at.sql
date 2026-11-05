/*
  Migration: Lock a billing period
  Date: 2026-11-05
  Description: payment_cycles.locked_at — set while an instructor has locked the
  period (no status or amount can change in the app), null = unlocked. Additive
  and nullable, so existing rows and older app builds keep working. RLS is
  unchanged: whoever may update a cycle may lock it. The lock is enforced in
  the client only (see the spec's Risks).

  Deploy before an app build with WatermelonDB schema v24 (the client pushes
  this column and the upsert fails without it), then redeploy `sync` (it sends
  null on unlock and converts the timestamp both ways).

  Spec: .ai/specs/2026-11-05-payments-lock-and-paid-confirmation.md
*/

alter table public.payment_cycles
  add column if not exists locked_at timestamptz null;
