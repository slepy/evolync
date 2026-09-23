/*
  Migration: Create Avatars Storage Bucket
  Date: 2026-02-18
  Description: Creates storage bucket for user avatar/profile images
*/

-- Create avatars bucket (public for easy access to profile photos)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- RLS Policies for avatars bucket

-- Allow authenticated users to upload avatars to their own user folder
create policy "Users can upload avatars to their folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatars
create policy "Users can update avatars in their folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatars
create policy "Users can delete avatars from their folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (bucket is public)
create policy "Public read access for avatars"
on storage.objects for select
to public
using (bucket_id = 'avatars');
