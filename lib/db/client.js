/**
 * Prisma client singleton — prevents multiple instances in Next.js hot reload.
 * Falls back gracefully when DATABASE_URL is not set (dev/testing without DB).
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.LOG_LEVEL === 'debug'
      ? ['query', 'info', 'warn', 'error']
      : ['warn', 'error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
