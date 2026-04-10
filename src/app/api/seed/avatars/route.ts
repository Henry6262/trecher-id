import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('secret') !== 'seed-kols-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const results: { handle: string; avatar: string | null; error?: string }[] = [];

  try {
    // Get all users from database
    const users = await prisma.user.findMany({
      where: { username: { not: '' } },
      select: { id: true, username: true, avatarUrl: true },
    });

    for (const user of users) {
      if (!user.username) continue;

      try {
        await page.goto(`https://x.com/${user.username}`, { waitUntil: 'networkidle', timeout: 8000 });

        // Extract avatar from profile image
        const avatarUrl = await page.locator('img[alt*="avatar"]').first().getAttribute('src');

        if (avatarUrl) {
          // Clean up Twitter image URL (remove query params)
          const cleanUrl = avatarUrl.split('?')[0];

          await prisma.user.update({
            where: { id: user.id },
            data: { avatarUrl: cleanUrl },
          });

          results.push({ handle: user.username, avatar: cleanUrl });
        } else {
          results.push({ handle: user.username, avatar: null, error: 'Avatar not found' });
        }
      } catch (error) {
        results.push({
          handle: user.username,
          avatar: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  } finally {
    await browser.close();
  }

  const successful = results.filter(r => r.avatar).length;
  return NextResponse.json({
    total: results.length,
    successful,
    results
  });
}
