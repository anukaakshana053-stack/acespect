import { randomUUID } from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';

/**
 * Supabase Storage for inspection photos. Express owns the upload (service-role
 * key) — the mobile app never writes to Supabase directly. The bucket is public
 * so returned URLs render directly in the web app.
 */
let _client: SupabaseClient | null = null;

function client(): SupabaseClient | null {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!_client) {
    _client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return _client;
}

export function isStorageEnabled(): boolean {
  return client() !== null;
}

/** Create the public bucket if it doesn't exist. Safe to call on boot. */
export async function ensureBucket(): Promise<boolean> {
  const c = client();
  if (!c) return false;
  const { data } = await c.storage.getBucket(env.SUPABASE_STORAGE_BUCKET);
  if (!data) {
    await c.storage.createBucket(env.SUPABASE_STORAGE_BUCKET, { public: true });
  }
  return true;
}

export interface UploadedPhoto {
  id: string;
  storageKey: string;
  url: string;
}

/** Upload one image; returns its storage key + public URL. */
export async function uploadPhoto(
  buffer: Buffer,
  contentType: string,
  ext: string,
): Promise<UploadedPhoto> {
  const c = client();
  if (!c) throw new Error('Photo storage is not configured');

  const id = randomUUID();
  const storageKey = `inspections/${id}.${ext}`;
  const { error } = await c.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .upload(storageKey, buffer, { contentType, upsert: false });
  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data } = c.storage.from(env.SUPABASE_STORAGE_BUCKET).getPublicUrl(storageKey);
  return { id, storageKey, url: data.publicUrl };
}
