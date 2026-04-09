import { NextResponse } from 'next/server';
import { getPreferredTwitterHandle } from '@/lib/axiom-twitter-handles';
import { prisma } from '@/lib/prisma';

export const maxDuration = 120;

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('secret') !== 'seed-kols-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const refreshAvatars = searchParams.get('avatars') === 'true';

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      bannerUrl: true,
      avatarUrl: true,
      wallets: {
        where: { isMain: true },
        select: { address: true },
        take: 1,
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const results: string[] = [];
  const errors: string[] = [];

  for (const user of users) {
    if (user.bannerUrl && !refreshAvatars) {
      results.push(`${user.username} — already has banner, skipped`);
      continue;
    }

    const walletAddress = user.wallets[0]?.address ?? null;
    const twitterHandle = getPreferredTwitterHandle({
      username: user.username,
      walletAddress,
    });
    if (!twitterHandle) {
      errors.push(`${user.username}: no resolvable twitter handle`);
      continue;
    }

    try {
      const res = await fetch(`https://api.fxtwitter.com/${twitterHandle}`);
      if (!res.ok) {
        errors.push(`${user.username} -> ${twitterHandle}: fxtwitter ${res.status}`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      const data = await res.json();
      const bannerUrl = data?.user?.banner_url;
      const avatarUrl = data?.user?.avatar_url?.replace('_normal', '_400x400') ?? null;
      const followerCount = data?.user?.followers ?? data?.user?.followers_count ?? null;
      const updates: Record<string, string> = {};

      if (bannerUrl && !user.bannerUrl) updates.bannerUrl = bannerUrl;
      if (avatarUrl && refreshAvatars) updates.avatarUrl = avatarUrl;

      if (followerCount !== null) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(updates as Record<string, string | number>),
            followerCount,
          },
        });
      } else if (Object.keys(updates).length > 0) {
        await prisma.user.update({ where: { id: user.id }, data: updates });
      }

      if (twitterHandle !== user.username) {
        await prisma.link.updateMany({
          where: { userId: user.id, icon: 'x' },
          data: {
            title: `@${twitterHandle}`,
            url: `https://x.com/${twitterHandle}`,
          },
        });
      }

      if (Object.keys(updates).length > 0 || followerCount !== null) {
        results.push(
          `${user.username} -> ${twitterHandle} — ✓ ${[
            ...Object.keys(updates),
            ...(followerCount !== null ? ['followerCount'] : []),
          ].join(' + ')} updated`,
        );
      } else {
        results.push(`${user.username} -> ${twitterHandle} — no updates needed`);
      }

      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      errors.push(
        `${user.username} -> ${twitterHandle}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return NextResponse.json({
    total: users.length,
    updated: results.filter(r => r.includes('✓')).length,
    results,
    errors,
  });
}
