import { File } from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

// Import supabase using require to avoid Metro bundler issues
const { supabase } = require('@/config/supabase');

/**
 * Uploads an image to Supabase Storage
 *
 * @param localUri - Local file URI (e.g., file://...)
 * @param bucket - Storage bucket name (default: 'product-images')
 * @param folder - Optional folder path within the bucket
 * @returns Promise<string> - Public URL of the uploaded image
 */
export async function uploadImage(
  localUri: string,
  bucket: string = 'product-images',
  folder?: string
): Promise<string> {
  // Skip if already a remote URL
  if (localUri.startsWith('http://') || localUri.startsWith('https://')) {
    return localUri;
  }

  // Read the file as base64 using the new expo-file-system API
  const file = new File(localUri);
  const base64 = await file.base64();

  // Determine file extension from URI
  const extension = localUri.split('.').pop()?.toLowerCase() || 'jpg';
  const contentType = extension === 'png' ? 'image/png' : 'image/jpeg';

  // Generate unique filename
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const filename = `${timestamp}-${randomSuffix}.${extension}`;
  const filePath = folder ? `${folder}/${filename}` : filename;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, decode(base64), {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

  if (!urlData?.publicUrl) {
    throw new Error('Failed to get public URL for uploaded image');
  }

  return urlData.publicUrl;
}
