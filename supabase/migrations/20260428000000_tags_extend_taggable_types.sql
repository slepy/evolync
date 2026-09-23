/*
  Migration: Fix taggables schema
  Date: 2026-04-28
  Description:
  - tags and taggables tables already exist from init_schema.sql
  - Remove restrictive taggable_type CHECK constraint (type validation handled in app)
  - Add missing taggable_id index
*/

-- Remove restrictive check constraint — taggable_type is open-ended
alter table public.taggables
  drop constraint if exists taggables_taggable_type_check;

-- Add taggable_id index if missing
create index if not exists idx_taggables_taggable_id
  on public.taggables(taggable_id);
