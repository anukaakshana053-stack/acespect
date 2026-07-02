import { Queue, ConnectionOptions } from 'bullmq';
import { env } from '../config/env';

/** Name of the review queue — shared by the producer (API) and the worker. */
export const REVIEW_QUEUE = 'review';

/**
 * Redis connection for BullMQ, parsed from REDIS_URL into a plain options
 * object. We let BullMQ construct/own the ioredis client (rather than passing
 * our own instance) so there's a single ioredis copy in play.
 * `maxRetriesPerRequest: null` is required by BullMQ workers.
 */
const redisUrl = new URL(env.REDIS_URL);
export const connection: ConnectionOptions = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port) || 6379,
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
  maxRetriesPerRequest: null,
};

/** Payload carried by each review job. Kept tiny — the worker re-reads the DB. */
export interface ReviewJobData {
  reviewJobId: string;
  inspectionId: string;
  version: number;
}

/** Producer-side queue handle. Import this in the API to enqueue reviews. */
export const reviewQueue = new Queue<ReviewJobData>(REVIEW_QUEUE, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

/**
 * Deterministic job id so a re-submit of the same inspection version is
 * de-duplicated by BullMQ instead of enqueued twice. Avoids ':' — BullMQ
 * reserves it and rejects custom ids containing one.
 */
export function reviewJobKey(inspectionId: string, version: number): string {
  return `${inspectionId}_v${version}`;
}
