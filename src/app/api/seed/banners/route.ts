import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const maxDuration = 120;

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('secret') !== 'seed-kols-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const refreshAvatars = searchParams.get('avatars') === 'true';

  const users = await prisma.user.findMany({
    select: { id: true, username: true, bannerUrl: true, avatarUrl: true },
    orderBy: { createdAt: 'asc' },
  });

  const results: string[] = [];
  const errors: string[] = [];

  for (const user of users) {
    if (user.bannerUrl && !refreshAvatars) {
      results.push(`${user.username} — already has banner, skipped`);
      continue;
    }

    try {
      const res = await fetch(`https://api.fxtwitter.com/${user.username}`);
      if (!res.ok) {
        errors.push(`${user.username}: fxtwitter ${res.status}`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      const data = await res.json();
      const bannerUrl = data?.user?.banner_url;
      const avatarUrl = data?.user?.avatar_url?.replace('_normal', '_400x400') ?? null;
      const updates: Record<string, string> = {};

      if (bannerUrl && !user.bannerUrl) updates.bannerUrl = bannerUrl;
      if (avatarUrl && refreshAvatars) updates.avatarUrl = avatarUrl;

      if (Object.keys(updates).length > 0) {
        await prisma.user.update({ where: { id: user.id }, data: updates });
        results.push(`${user.username} — ✓ ${Object.keys(updates).join(' + ')} updated`);
      } else {
        results.push(`${user.username} — no updates needed`);
      }

      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      errors.push(`${user.username}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({
    total: users.length,
    updated: results.filter(r => r.includes('✓')).length,
    results,
    errors,
  });
}
