import { Worker } from 'bullmq';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { REVIEW_QUEUE, connection } from '../lib/queue';
import { processReview } from './reviewProcessor';

/**
 * Review worker process. Run separately from the API (`npm run dev:worker`) so
 * AI/queue load never blocks request handling, and the two scale independently.
 */
async function main() {
  const worker = new Worker(REVIEW_QUEUE, processReview, {
    connection,
    concurrency: env.REVIEW_QUEUE_CONCURRENCY,
  });

  worker.on('ready', () => {
    // eslint-disable-next-line no-console
    console.log(
      `🤖 review worker ready (concurrency ${env.REVIEW_QUEUE_CONCURRENCY}, ` +
        `AI ${env.AI_SERVICE_URL ? env.AI_SERVICE_URL : 'SIMULATED'})`,
    );
  });
  worker.on('completed', (job) => {
    // eslint-disable-next-line no-console
    console.log(`✅ review job ${job.id} done`);
  });
  worker.on('failed', (job, err) => {
    // eslint-disable-next-line no-console
    console.error(`❌ review job ${job?.id} failed: ${err.message}`);
  });

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} received — closing worker...`);
    await worker.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void main();
