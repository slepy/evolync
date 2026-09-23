/*
  Migration: Create Storage Buckets
  Date: 2026-01-20
  Description: Creates storage buckets for product images and other assets
*/

-- Create product-images bucket (public for easy access to product photos)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- RLS Policies for product-images bucket

-- Allow authenticated users to upload images to their organization folder
create policy "Users can upload product images to their org folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] in (
    select o.id::text from public.organizations o where o.owner_id = auth.uid()
  )
);

-- Allow authenticated users to update their organization's images
create policy "Users can update product images in their org folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] in (
    select o.id::text from public.organizations o where o.owner_id = auth.uid()
  )
);

-- Allow authenticated users to delete their organization's images
create policy "Users can delete product images from their org folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] in (
    select o.id::text from public.organizations o where o.owner_id = auth.uid()
  )
);

-- Allow public read access (bucket is public)
create policy "Public read access for product images"
on storage.objects for select
to public
using (bucket_id = 'product-images');
