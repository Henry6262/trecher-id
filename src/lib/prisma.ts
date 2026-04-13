import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function readDatabaseUrlFromEnvFile(): string | undefined {
  const candidates = ['.env.local', '.env'];

  for (const filename of candidates) {
    const filePath = path.join(process.cwd(), filename);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/^DATABASE_URL="?([^\n"]+)"?\s*$/m);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    if (!globalForPrisma.prisma) {
      let url = process.env.DATABASE_URL;
      if (!url) {
        loadEnvConfig(process.cwd(), true);
        url = process.env.DATABASE_URL;
      }
      if (!url) {
        url = readDatabaseUrlFromEnvFile();
      }
      if (!url) throw new Error('DATABASE_URL is not set');
      const pool = new pg.Pool({ connectionString: url });
      const adapter = new PrismaPg(pool);
      globalForPrisma.prisma = new PrismaClient({ adapter });
    }
    return Reflect.get(globalForPrisma.prisma, prop);
  },
});
