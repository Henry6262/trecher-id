import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isTestAuthEnabled, normalizeTestUsername, signSessionToken } from '@/lib/test-auth';

export async function POST(req: NextRequest) {
  if (!isTestAuthEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const username = normalizeTestUsername(body.username);
  const displayName = typeof body.displayName === 'string' && body.displayName.trim()
    ? body.displayName.trim().slice(0, 32)
    : username;
  const bio = typeof body.bio === 'string' ? body.bio.trim().slice(0, 160) : null;

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      displayName,
      bio,
      isClaimed: true,
    },
    create: {
      username,
      displayName,
      bio,
      isClaimed: true,
      twitterId: `test_twitter_${username}`,
      privyUserId: `test_privy_${username}`,
    },
  });

  const session = await signSessionToken({ id: user.id, username: user.username });
  const response = NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    },
    sessionToken: session,
  });

  response.cookies.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  response.cookies.set('test-auth', '1', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return response;
}

export async function DELETE() {
  if (!isTestAuthEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('session', '', { httpOnly: true, expires: new Date(0), path: '/' });
  response.cookies.set('test-auth', '', { httpOnly: false, expires: new Date(0), path: '/' });
  return response;
}
