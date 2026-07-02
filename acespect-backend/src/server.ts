import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

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
