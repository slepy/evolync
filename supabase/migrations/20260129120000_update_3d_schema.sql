/*
  Migration: Refactor 3D Module Schema
  Date: 2026-01-29
  Description: 
  - Adds `body_pose_presets` table for hand/foot configurations.
  - Refactors `techniques` to use a single `data` field (snapshot) instead of separate fields.
  - Refactors `sequence_steps` to include `data` (full body snapshot).
  - Updates `sequences` with `cover_image_url` (static thumbnail).
*/

-- 1. Create body_pose_presets table
create table if not exists public.body_pose_presets (
  id uuid not null default gen_random_uuid() primary key,
  name text not null,
  body_part_type text not null, -- 'hand', 'foot'
  data jsonb not null,
  is_system boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

alter table public.body_pose_presets enable row level security;

create trigger on_body_pose_presets_updated
  before update on public.body_pose_presets
  for each row execute procedure public.handle_updated_at();

create policy "Everyone can read body_pose_presets"
  on public.body_pose_presets for select
  using (true);

-- 2. Refactor techniques table
-- Add 'data' column
alter table public.techniques 
  add column if not exists data jsonb not null default '{}'::jsonb;

-- Remove singular columns in favor of 'data' snapshot
alter table public.techniques 
  drop column if exists rotation_data,
  drop column if exists position_data,
  drop column if exists custom_data,
  drop column if exists hand_pose_preset;

-- 3. Refactor sequence_steps table
-- Add 'data' column for full body snapshot
alter table public.sequence_steps
  add column if not exists data jsonb;

-- Remove legacy columns if any
alter table public.sequence_steps
  drop column if exists snapshot_data;

-- 4. Update sequences table
-- Use static image URL instead of referenced step for performance
alter table public.sequences
  add column if not exists cover_image_url text;
  
-- Clean up cover_step_id if it was added previously (in drafts)
alter table public.sequences
  drop column if exists cover_step_id;

-- 5. Indexes
create index if not exists idx_body_pose_presets_updated_at on public.body_pose_presets(updated_at);

-- 6. Step Techniques (Cleanup)
alter table public.step_techniques
  drop column if exists hand_pose_preset;
