import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cached, redis } from '@/lib/redis';
import { getBoostPercent, getTierInfo } from '@/lib/referral-tiers';

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stats = await cached(`referral:stats:${session.id}`, 60, async () => {
    const [validatedCount, pendingCount, recentReferrals] = await Promise.all([
      prisma.referral.count({
        where: { referrerId: session.id, status: 'validated' },
      }),
      prisma.referral.count({
        where: { referrerId: session.id, status: 'pending' },
      }),
      prisma.referral.findMany({
        where: { referrerId: session.id, status: 'validated' },
        orderBy: { validatedAt: 'desc' },
        take: 10,
        include: {
          referredUser: {
            select: { username: true, displayName: true, avatarUrl: true },
          },
        },
      }),
    ]);

    const currentBoost = getBoostPercent(validatedCount);
    const { currentTier, nextTier, remaining } = getTierInfo(validatedCount);

    return {
      referralCode: session.username,
      validatedCount,
      pendingCount,
      currentBoost,
      currentTier: currentTier
        ? { min: currentTier.min, max: currentTier.max === Infinity ? null : currentTier.max, boost: currentTier.boost }
        : null,
      nextTier: nextTier
        ? { min: nextTier.min, max: nextTier.max === Infinity ? null : nextTier.max, boost: nextTier.boost, remaining }
        : null,
      recentReferrals: recentReferrals.map((r) => ({
        username: r.referredUser.username,
        displayName: r.referredUser.displayName,
        avatarUrl: r.referredUser.avatarUrl,
        validatedAt: r.validatedAt?.toISOString() ?? r.createdAt.toISOString(),
      })),
    };
  });

  return NextResponse.json(stats);
}

// Allow cache invalidation via POST
export async function POST() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await redis.del(`referral:stats:${session.id}`);
  } catch {
    // Redis down
  }

  return NextResponse.json({ ok: true });
}
