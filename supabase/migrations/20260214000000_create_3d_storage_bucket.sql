/*
  Migration: Create 3D Sequences Storage Bucket
  Date: 2026-02-14
  Description: Creates storage bucket for 3D sequence cover images
*/

-- Create 3d-sequences bucket (public for cover images)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  '3d-sequences',
  '3d-sequences',
  true,
  5242880, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- RLS Policies for 3d-sequences bucket

-- Allow authenticated users to upload cover images to their user folder
create policy "Users can upload 3d sequence images to their folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = '3d-sequences'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their images
create policy "Users can update 3d sequence images in their folder"
on storage.objects for update
to authenticated
using (
  bucket_id = '3d-sequences'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their images
create policy "Users can delete 3d sequence images from their folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = '3d-sequences'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (bucket is public)
create policy "Public read access for 3d sequence images"
on storage.objects for select
to public
using (bucket_id = '3d-sequences');
