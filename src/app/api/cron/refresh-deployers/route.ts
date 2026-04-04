import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTopDeployers } from '@/lib/dune';
import { getTokenMetadata } from '@/lib/helius';

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
    let wallet = await prisma.wallet.findFirst({
      where: { address: dep.deployer_wallet },
      include: { user: true },
    });

    let userId: string;

    if (!wallet) {
      // Create unclaimed profile
      const shortAddr = dep.deployer_wallet.slice(0, 6) + '...' + dep.deployer_wallet.slice(-4);
      const username = dep.deployer_wallet.slice(0, 12).toLowerCase();

      const user = await prisma.user.create({
        data: {
          username,
          displayName: shortAddr,
          bio: `Top memecoin deployer — ${dep.total_migrated} migrations`,
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
        },
      });

      userId = user.id;
      created++;
    } else {
      userId = wallet.userId;
      updated++;
    }

    // Upsert token deployment for best token (if available)
    if (dep.best_token_mint) {
      const metadata = await getTokenMetadata([dep.best_token_mint]);
      const meta = metadata.get(dep.best_token_mint);

      await prisma.tokenDeployment.upsert({
        where: { tokenMint: dep.best_token_mint },
        create: {
          userId,
          walletAddress: dep.deployer_wallet,
          tokenMint: dep.best_token_mint,
          tokenSymbol: meta?.symbol ?? dep.best_token_mint.slice(0, 6),
          tokenName: dep.best_token_name ?? meta?.name ?? null,
          tokenImageUrl: meta?.image ?? null,
          platform: 'pump.fun',
          status: 'migrated',
          mcapAthUsd: dep.best_token_mcap,
          devPnlSol: dep.dev_pnl_sol,
          devPnlUsd: dep.dev_pnl_usd,
          deployedAt: new Date(),
        },
        update: {
          mcapAthUsd: dep.best_token_mcap,
          devPnlSol: dep.dev_pnl_sol,
          devPnlUsd: dep.dev_pnl_usd,
          status: 'migrated',
          updatedAt: new Date(),
        },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    deployers: deployers.length,
    created,
    updated,
  });
}
