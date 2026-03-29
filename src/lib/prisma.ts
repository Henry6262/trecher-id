import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// Lazy initialization — PrismaClient is only created on first property access,
// not at module import time. This prevents build-time errors when DATABASE_URL
// is not yet available (e.g. during Next.js static analysis).
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient();
    }
    return Reflect.get(globalForPrisma.prisma, prop);
  },
});
