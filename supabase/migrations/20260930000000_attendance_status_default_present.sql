-- Align attendance_records.status column default with the client's DEFAULT_ATTENDANCE_STATUS
-- ('present'). Existing rows are left untouched; only the column default changes.

alter table public.attendance_records
  alter column status set default 'present';
