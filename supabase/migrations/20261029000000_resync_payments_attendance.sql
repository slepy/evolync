/*
  Migration: Re-send payments and attendance to members
  Date: 2026-10-29
  Description: The sync function used to keep the pushing device's updated_at
  on insert, so a payment or attendance record made by the instructor could be
  stamped before a student's last pull and never reach the student. The sync
  function now leaves updated_at to the server; touching the live rows (the
  before-update trigger sets now()) makes every device pull them once more.
  No notification trigger fires on update of these tables.
*/

update public.payment_cycles set updated_at = now() where deleted_at is null;
update public.payment_records set updated_at = now() where deleted_at is null;
update public.training_sessions set updated_at = now() where deleted_at is null;
update public.attendance_records set updated_at = now() where deleted_at is null;
