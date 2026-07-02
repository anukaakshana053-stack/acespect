import { PrismaClient } from '@prisma/client';
import { isProd } from '../config/env';

/**
 * Single PrismaClient for the process. The globalThis cache prevents a new
 * client (and connection pool) being created on every hot-reload in dev.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProd ? ['error'] : ['warn', 'error'],
  });

if (!isProd) globalForPrisma.prisma = prisma;
