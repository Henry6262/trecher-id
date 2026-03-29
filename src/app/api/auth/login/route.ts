import { NextRequest, NextResponse } from 'next/server';
import { privyClient } from '@/lib/privy';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  let privyUser;
  try {
    const { userId } = await privyClient.verifyAuthToken(token);
    privyUser = await privyClient.getUser(userId);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // privyUser.twitter shape (from @privy-io/server-auth types):
  // { subject: string; username: string | null; name: string | null; profilePictureUrl?: string | null }
  const twitter = privyUser.twitter;
  if (!twitter) {
    return NextResponse.json({ error: 'Twitter not linked' }, { status: 400 });
  }

  const username = twitter.username ?? twitter.subject;

  const user = await prisma.user.upsert({
    where: { privyUserId: privyUser.id },
    update: {
      displayName: twitter.name ?? username,
      avatarUrl: twitter.profilePictureUrl ?? null,
    },
    create: {
      privyUserId: privyUser.id,
      twitterId: twitter.subject,
      username,
      displayName: twitter.name ?? username,
      avatarUrl: twitter.profilePictureUrl ?? null,
    },
  });

  const jwt = await new SignJWT({ sub: user.id, username: user.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  const response = NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    },
  });

  response.cookies.set('session', jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return response;
}
