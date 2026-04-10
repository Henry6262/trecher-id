import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchFxTwitterProfile } from '@/lib/fxtwitter';

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('secret') !== 'seed-kols-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: { handle: string; avatar: string | null; error?: string; success?: boolean }[] = [];

  try {
    // Get all users from database
    const users = await prisma.user.findMany({
      where: { username: { not: '' } },
      select: { id: true, username: true, avatarUrl: true },
    });

    for (const user of users) {
      if (!user.username) continue;

      try {
        // Use fxtwitter API (no auth required, no blocking)
        const profile = await fetchFxTwitterProfile(user.username);

        if (profile.avatarUrl) {
          await prisma.user.update({
            where: { id: user.id },
            data: { avatarUrl: profile.avatarUrl },
          });

          results.push({ handle: user.username, avatar: profile.avatarUrl, success: true });
        } else {
          results.push({ handle: user.username, avatar: null, error: 'No avatar on fxtwitter' });
        }
      } catch (error) {
        results.push({
          handle: user.username,
          avatar: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  } catch (error) {
    console.error('Avatar seed error:', error);
  }

  const successful = results.filter(r => r.success).length;
  return NextResponse.json({
    total: results.length,
    successful,
    results
  });
}
