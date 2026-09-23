/*
  Migration: Make body_pose_presets user-owned
  Date: 2026-02-26
  Description:
  - Add user_id column to body_pose_presets (user-owned, not system-wide)
  - Remove is_system column (no longer needed)
  - Update RLS policies to filter by user_id
*/

-- 1. Add user_id column to body_pose_presets
alter table public.body_pose_presets
  add column if not exists user_id uuid not null default auth.uid();

-- 2. Add index on user_id for performance
create index if not exists idx_body_pose_presets_user_id on public.body_pose_presets(user_id);

-- 3. Remove is_system column (it's no longer needed)
alter table public.body_pose_presets
  drop column if exists is_system;

-- 4. Update RLS policies for user-owned presets
-- Drop old policy
drop policy if exists "Everyone can read body_pose_presets" on public.body_pose_presets;

-- New policy: Users can only read their own presets
create policy "Users can read own body_pose_presets"
  on public.body_pose_presets for select
  using (auth.uid() = user_id);

-- Users can insert their own presets
create policy "Users can insert own body_pose_presets"
  on public.body_pose_presets for insert
  with check (auth.uid() = user_id);

-- Users can update their own presets
create policy "Users can update own body_pose_presets"
  on public.body_pose_presets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own presets
create policy "Users can delete own body_pose_presets"
  on public.body_pose_presets for delete
  using (auth.uid() = user_id);
