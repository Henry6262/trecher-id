import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import './config'; // Ensures validation runs

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    if (!globalForPrisma.prisma) {
      const url = process.env.DATABASE_URL?.replace(/\\n/g, '').trim();
      if (!url) {
        throw new Error('DATABASE_URL is not set. Ensure config validation ran.');
      }
      const pool = new pg.Pool({ connectionString: url });
      const adapter = new PrismaPg(pool);
      globalForPrisma.prisma = new PrismaClient({ adapter });
    }
    return Reflect.get(globalForPrisma.prisma, prop);
  },
});
