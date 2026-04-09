import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const BAD_KOLS = ['blknoiz06', 'ansem', 'hsaka', 'mando', 'gainzy', 'sol_trader_x', 'criptoman', 'trench_god', 'pump_queen', 'degen_alpha'];

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('secret') !== 'seed-kols-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: string[] = [];

  for (const username of BAD_KOLS) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      results.push(`${username} — not found, skipped`);
      continue;
    }

    // Delete all related data (cascade should handle most, but be explicit)
    await prisma.pinnedTrade.deleteMany({ where: { userId: user.id } });
    await prisma.walletTrade.deleteMany({ where: { wallet: { userId: user.id } } });
    await prisma.walletTradeEvent.deleteMany({ where: { wallet: { userId: user.id } } });
    await prisma.userRanking.deleteMany({ where: { userId: user.id } });
    await prisma.tokenDeployment.deleteMany({ where: { userId: user.id } });
    await prisma.link.deleteMany({ where: { userId: user.id } });
    await prisma.wallet.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });

    results.push(`${username} — DELETED`);
  }

  return NextResponse.json({ ok: true, results });
}
