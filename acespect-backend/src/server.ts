import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { ensureBucket, isStorageEnabled } from './lib/storage';

async function main() {
  const app = createApp();

  // Verify DB connectivity up front so misconfig surfaces at boot, not mid-request.
  try {
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log('✅ Database connected');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('⚠️  Could not connect to the database. Check DATABASE_URL.', err);
  }

  // Create the Supabase photo bucket if it doesn't exist yet. No-op (returns
  // false) when SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY aren't set.
  if (isStorageEnabled()) {
    try {
      await ensureBucket();
      // eslint-disable-next-line no-console
      console.log(`✅ Photo storage ready (bucket "${env.SUPABASE_STORAGE_BUCKET}")`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('⚠️  Could not verify/create the Supabase storage bucket.', err);
    }
  } else {
    // eslint-disable-next-line no-console
    console.warn('⚠️  Photo storage disabled — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable photo uploads.');
  }

  const server = app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 acespect-backend listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} received — shutting down...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void main();
