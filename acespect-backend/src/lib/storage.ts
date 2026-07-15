import { randomUUID } from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { env } from '../config/env';

// Every photo used in the review UI and the generated report is resized to
// one consistent size at upload time -- this replaces the old manual
// "select all, right-click, Resize Pictures to Medium" desktop workflow.
// 1366x768 mirrors that tool's "Medium" preset; it keeps reports fast to
// generate without a visible quality loss.
const REPORT_MAX_WIDTH = 1366;
const REPORT_MAX_HEIGHT = 768;
const REPORT_JPEG_QUALITY = 82;

/**
 * Supabase Storage for inspection photos. Express owns the upload (service-role
 * key) — the mobile app never writes to Supabase directly. The bucket is public
 * so returned URLs render directly in the web app.
 */
let _client: SupabaseClient | null = null;

function client(): SupabaseClient | null {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!_client) {
    // createClient() also wires up a Realtime websocket client, which throws
    // synchronously on runtimes without a native WebSocket global (Node < 22).
    // We only use Storage here, so a Realtime init failure shouldn't be fatal —
    // treat it the same as "not configured" rather than crashing the process.
    try {
      _client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('⚠️  Failed to initialize the Supabase client.', err);
      return null;
    }
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

/**
 * Outbound calls to Supabase occasionally fail with a generic "fetch failed"
 * whose root cause (confirmed via logging) is a transient DNS resolution
 * miss (ENOTFOUND) from the container's resolver -- the same host resolves
 * fine moments before/after. Node's fetch/undici doesn't retry DNS misses on
 * its own, so a short bounded retry absorbs the blip instead of failing the
 * whole request.
 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastErr;
}

/** Upload one image; resizes it for the report/UI and returns its storage key + public URL. */
export async function uploadPhoto(
  buffer: Buffer,
  contentType: string,
  ext: string,
): Promise<UploadedPhoto> {
  const c = client();
  if (!c) throw new Error('Photo storage is not configured');

  const id = randomUUID();

  // rotate() with no args bakes in the EXIF orientation tag (phone photos are
  // often stored sideways/upside-down relative to how they should display)
  // then strips it, so the resized copy always renders right-side-up.
  const resized = await sharp(buffer)
    .rotate()
    .resize({
      width: REPORT_MAX_WIDTH,
      height: REPORT_MAX_HEIGHT,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: REPORT_JPEG_QUALITY })
    .toBuffer();

  const storageKey = `inspections/${id}.jpg`;
  const { error } = await withRetry(() =>
    c.storage.from(env.SUPABASE_STORAGE_BUCKET).upload(storageKey, resized, {
      contentType: 'image/jpeg',
      upsert: false,
    }),
  );
  if (error) throw new Error(`Supabase upload failed: ${error.message}`, { cause: error });

  // Keep the untouched original alongside it -- not linked anywhere in the
  // app today, but preserved in case a full-resolution copy is ever needed.
  // Non-fatal: the report copy above is what the app actually depends on.
  const originalKey = `inspections/${id}-original.${ext}`;
  try {
    const { error: originalError } = await withRetry(() =>
      c.storage.from(env.SUPABASE_STORAGE_BUCKET).upload(originalKey, buffer, { contentType, upsert: false }),
    );
    if (originalError) throw originalError;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('⚠️  Failed to store the original photo (resized report copy still saved).', err);
  }

  const { data } = c.storage.from(env.SUPABASE_STORAGE_BUCKET).getPublicUrl(storageKey);
  return { id, storageKey, url: data.publicUrl };
}
