import { NextRequest, NextResponse } from 'next/server';
import { privyClient } from '@/lib/privy';
import { invalidatePublicProfileCache } from '@/lib/profile';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { SignJWT } from 'jose';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

export async function POST(req: NextRequest) {
  // Fix 3: JWT_SECRET guard — fail fast at request time, not silently at signing
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET env var is not set');
  const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
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
    // Fix 4: Sync twitterId on re-login alongside display fields
    user = await prisma.user.update({
      where: { id: user.id },
      data: { twitterId: twitter.subject, displayName, avatarUrl },
    });
  } else {
    // Fix 1 & 2: Stage 2 — atomic claim via updateMany + P2002 handling
    try {
      const { count } = await prisma.user.updateMany({
        where: { username, privyUserId: null },
        data: {
          privyUserId: privyUser.id,
          twitterId: twitter.subject,
          displayName,
          avatarUrl,
          isClaimed: true,
        },
      });

      if (count > 0) {
        // Fetch the record we just claimed
        user = await prisma.user.findUnique({
          where: { privyUserId: privyUser.id },
        });
      }

      if (!user) {
        // count === 0 means row was concurrently claimed — fall through to Stage 3
        // Fix 5: self-registered users own their profile from day 1
        user = await prisma.user.create({
          data: {
            privyUserId: privyUser.id,
            twitterId: twitter.subject,
            username,
            displayName,
            avatarUrl,
            isClaimed: true,
          },
        });
      }
    } catch (err) {
      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 409 },
        );
      }
      throw err;
    }
  }

  // --- Referral processing ---
  const refCode = req.cookies.get('ref_code')?.value;
  if (refCode && user) {
    try {
      // Only process if user doesn't already have a referrer
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { referredById: true },
      });

      if (!currentUser?.referredById) {
        const referrer = await prisma.user.findFirst({
          where: { username: { equals: refCode, mode: 'insensitive' } },
          select: { id: true },
        });

        if (referrer && referrer.id !== user.id) {
          // Check follower count anti-bot gate
          const minFollowers = parseInt(process.env.MIN_REFERRAL_FOLLOWERS ?? '5', 10);
          const skipValidation = (user.followerCount ?? 0) < minFollowers;

          await prisma.$transaction([
            prisma.user.update({
              where: { id: user.id },
              data: { referredById: referrer.id },
            }),
            prisma.referral.create({
              data: {
                referrerId: referrer.id,
                referredUserId: user.id,
                status: skipValidation ? 'pending' : 'validated',
                validatedAt: skipValidation ? null : new Date(),
              },
            }),
          ]);

          // Invalidate referrer's cached stats
          try {
            await redis.del(`referral:stats:${referrer.id}`);
          } catch {
            // Redis down — cache will expire naturally
          }
        }
      }
    } catch {
      // Referral processing is non-critical — don't block login
    }
  }

  // Fire-and-forget: fetch Twitter banner if user doesn't have one
  if (!user!.bannerUrl) {
    fetch(`https://api.fxtwitter.com/${user!.username}`)
      .then(r => r.json())
      .then(data => {
        const banner = data?.user?.banner_url;
        if (banner) {
          prisma.user
            .update({ where: { id: user!.id }, data: { bannerUrl: banner } })
            .then(() => invalidatePublicProfileCache(user!.username))
            .catch(() => {});
        }
      })
      .catch(() => {});
  }

  await invalidatePublicProfileCache(user!.username);

  const jwt = await new SignJWT({ sub: user!.id, username: user!.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  const response = NextResponse.json({
    user: {
      id: user!.id,
      username: user!.username,
      displayName: user!.displayName,
      avatarUrl: user!.avatarUrl,
    },
  });

  response.cookies.set('session', jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  // Clear referral cookie after processing
  if (refCode) {
    response.cookies.set('ref_code', '', { maxAge: 0, path: '/' });
  }

  return response;
}
