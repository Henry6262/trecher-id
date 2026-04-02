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
  const displayName = twitter.name ?? username;
  const avatarUrl = twitter.profilePictureUrl ?? null;

  // Stage 1: already claimed — find by privyUserId
  let user = await prisma.user.findUnique({
    where: { privyUserId: privyUser.id },
  });

  if (user) {
    // Update mutable display fields on every login
    user = await prisma.user.update({
      where: { id: user.id },
      data: { displayName, avatarUrl },
    });
  } else {
    // Stage 2: seeded profile waiting to be claimed — match by username with no privyUserId
    const seeded = await prisma.user.findFirst({
      where: { username, privyUserId: null },
    });

    if (seeded) {
      user = await prisma.user.update({
        where: { id: seeded.id },
        data: {
          privyUserId: privyUser.id,
          twitterId: twitter.subject,
          displayName,
          avatarUrl,
          isClaimed: true,
        },
      });
    } else {
      // Stage 3: brand-new user — create fresh profile
      user = await prisma.user.create({
        data: {
          privyUserId: privyUser.id,
          twitterId: twitter.subject,
          username,
          displayName,
          avatarUrl,
          isClaimed: false,
        },
      });
    }
  }

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
