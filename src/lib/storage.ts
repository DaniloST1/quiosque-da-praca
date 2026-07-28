import { supabase } from './supabase';
import imageCompression from 'browser-image-compression';

export type StorageBucket = 'products' | 'gallery' | 'banners' | 'uploads' | 'logos';

const compressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: false,
  fileType: 'image/webp' as const,
};

export async function uploadImage(
  bucket: StorageBucket,
  file: File,
  path?: string
): Promise<string> {
  const isVideo = file.type.startsWith('video/');
  let fileToUpload: File | Blob = file;
  let ext = file.name.split('.').pop() || 'webp';
  let contentType = file.type;

  if (!isVideo) {
    try {
      // Compress before upload
      fileToUpload = await imageCompression(file, compressionOptions);
      ext = 'webp';
      contentType = 'image/webp';
    } catch (e) {
      console.warn('Image compression failed, uploading raw file', e);
    }
  }

  const fileName = path || `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, fileToUpload, { upsert: true, contentType });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return `${urlData.publicUrl}?v=${Date.now()}`;
}

export async function replaceImage(
  bucket: StorageBucket,
  oldPath: string | null,
  newFile: File
): Promise<string> {
  if (oldPath) {
    const urlPart = oldPath.split(`/storage/v1/object/public/${bucket}/`)[1];
    if (urlPart) {
      const pathPart = urlPart.split('?')[0];
      await supabase.storage.from(bucket).remove([pathPart]);
    }
  }
  return uploadImage(bucket, newFile);
}

export async function deleteImage(bucket: StorageBucket, url: string): Promise<void> {
  const urlPart = url.split(`/storage/v1/object/public/${bucket}/`)[1];
  if (!urlPart) return;
  const pathPart = urlPart.split('?')[0];
  await supabase.storage.from(bucket).remove([pathPart]);
}

export async function getStorageUsage(): Promise<Record<StorageBucket, number>> {
  const buckets: StorageBucket[] = ['products', 'gallery', 'banners', 'uploads', 'logos'];
  const result: Record<string, number> = {};

  for (const bucket of buckets) {
    const { data } = await supabase.storage.from(bucket).list('', { limit: 1000 });
    const totalBytes = data?.reduce((sum, f) => sum + (f.metadata?.size || 0), 0) || 0;
    result[bucket] = totalBytes;
  }

  return result as Record<StorageBucket, number>;
}
