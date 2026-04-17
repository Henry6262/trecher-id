import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { code } = (await req.json()) as { code?: string };
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    const cleaned = code.trim().toLowerCase();
    if (!cleaned || cleaned.length > 50) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    // Rate limit: 10 captures per IP per hour
    const ip = getClientIp(req);
    const { allowed } = await rateLimit(`ref_capture:${ip}`, 10, 3600);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
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
  } catch (err) {
    logger.error('api/referral/capture', 'Failed to capture referral', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
