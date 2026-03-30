import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const count = await prisma.user.count();
    const firstUser = await prisma.user.findFirst({ select: { username: true } });
    return NextResponse.json({
      ok: true,
      count,
      firstUser,
      dbUrl: process.env.DATABASE_URL?.slice(0, 30) + '...',
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: String(e),
      stack: e instanceof Error ? e.stack?.split('\n').slice(0, 5) : undefined,
      dbUrl: process.env.DATABASE_URL?.slice(0, 30) + '...',
    }, { status: 500 });
  }
}
