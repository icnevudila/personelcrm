import { createClient } from "@/lib/supabase/client";

const defaultBucket =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "crm-uploads";

/**
 * İstemci tarafında dosya yükleme (Storage). Yol: `${userId}/dosya-adi.ext` (RLS ile uyumlu).
 * @param {string} path - Bucket içi tam yol
 * @param {File|Blob} file
 * @param {{ bucket?: string, upsert?: boolean }} options
 */
export async function uploadFile(path, file, options = {}) {
  const bucket = options.bucket ?? defaultBucket;
  const supabase = createClient();

  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: options.upsert ?? false,
  });

  return { data, error, bucket };
}

/**
 * Private bucket için geçici indirme/görüntüleme URL’si.
 * @param {string} path - Bucket içi yol
 * @param {number} expiresIn - Saniye (varsayılan 3600)
 */
export async function createSignedUrl(path, expiresIn = 3600, options = {}) {
  const bucket = options.bucket ?? defaultBucket;
  const supabase = createClient();
  return supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
}
