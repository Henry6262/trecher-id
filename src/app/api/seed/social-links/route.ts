import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Known social links for top KOLs (manually curated from X bios)
const KOL_SOCIALS: Record<string, { title: string; url: string; icon: string }[]> = {
  cented7: [
    { title: 'Twitch', url: 'https://twitch.tv/cented', icon: 'twitch' },
  ],
  // Add more KOLs here as you scrape their X bios:
  // username: [
  //   { title: 'Twitch', url: 'https://twitch.tv/...', icon: 'twitch' },
  //   { title: 'Discord', url: 'https://discord.gg/...', icon: 'discord' },
  //   { title: 'Telegram', url: 'https://t.me/...', icon: 'telegram' },
  // ],
};

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  if (secret !== 'seed-kols-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let added = 0;
  let skipped = 0;

  for (const [username, links] of Object.entries(KOL_SOCIALS)) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) { skipped++; continue; }

    const existing = await prisma.link.findMany({ where: { userId: user.id } });
    const existingUrls = new Set(existing.map(l => l.url));
    const maxOrder = existing.reduce((max, l) => Math.max(max, l.order), 0);

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      if (existingUrls.has(link.url)) { skipped++; continue; }

      await prisma.link.create({
        data: {
          userId: user.id,
          title: link.title,
          url: link.url,
          icon: link.icon,
          order: maxOrder + i + 1,
        },
      });
      added++;
    }
  }

  return NextResponse.json({ ok: true, added, skipped });
}
