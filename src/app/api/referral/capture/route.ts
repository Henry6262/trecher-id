import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export async function POST(req: NextRequest) {
  const { code } = (await req.json()) as { code?: string };
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const cleaned = code.trim().toLowerCase();
  if (!cleaned || cleaned.length > 50) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
  }

  // Rate limit: 10 captures per IP per hour
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rateKey = `ref_capture:${ip}`;
  try {
    const count = await redis.incr(rateKey);
    if (count === 1) await redis.expire(rateKey, 3600);
    if (count > 10) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }
  } catch {
    // Redis down — skip rate limiting
  }

  // Validate referrer exists
  const referrer = await prisma.user.findFirst({
    where: { username: { equals: cleaned, mode: 'insensitive' } },
    select: { id: true },
  });

  if (!referrer) {
    return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('ref_code', cleaned, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return response;
}
