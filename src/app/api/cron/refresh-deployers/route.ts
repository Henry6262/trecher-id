import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTopDeployers } from '@/lib/dune';

export const maxDuration = 120;

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const vercelCron = req.headers.get('x-vercel-cron');
  const cronSecret = process.env.CRON_SECRET;
  const isVercelCron = vercelCron === '1' && process.env.NODE_ENV === 'production';
  const isManualAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isVercelCron && !isManualAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deployers = await getTopDeployers(20);

  let created = 0;
  let updated = 0;

  for (const dep of deployers) {
    // Find or create user by wallet address
    const wallet = await prisma.wallet.findFirst({
      where: { address: dep.deployer_wallet },
      include: { user: true },
    });

    if (!wallet) {
      // Create unclaimed profile for top deployer
      const shortAddr = dep.deployer_wallet.slice(0, 6) + '...' + dep.deployer_wallet.slice(-4);
      const username = dep.deployer_wallet.slice(0, 12).toLowerCase();

      const user = await prisma.user.create({
        data: {
          username,
          displayName: shortAddr,
          bio: `Top memecoin deployer — ${dep.total_migrated} migrations, ${dep.total_deployed} total tokens`,
          isClaimed: false,
        },
      });

      await prisma.wallet.create({
        data: {
          userId: user.id,
          address: dep.deployer_wallet,
          chain: 'solana',
          verified: false,
          isMain: true,
          totalTrades: dep.total_deployed,
        },
      });

      created++;
    } else {
      // Update existing profile bio with latest stats
      await prisma.user.update({
        where: { id: wallet.userId },
        data: {
          bio: `Top memecoin deployer — ${dep.total_migrated} migrations, ${dep.total_deployed} total tokens`,
        },
      });
      updated++;
    }
  }

  return NextResponse.json({
    ok: true,
    deployers: deployers.length,
    created,
    updated,
  });
}
