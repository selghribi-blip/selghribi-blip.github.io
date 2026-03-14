import { PrismaClient } from '@prisma/client';

// Declare a global variable to hold the Prisma client instance across hot-reloads in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Returns a singleton PrismaClient instance.
 * In development, the instance is stored on `globalThis` to prevent
 * creating a new connection pool on every hot-module reload.
 */
const prisma: PrismaClient = globalThis.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
