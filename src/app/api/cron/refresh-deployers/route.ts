import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTopDeployers } from '@/lib/dune';
import {
  buildDeployerBio,
  buildUnclaimedDeployerIdentity,
  reconcileSnapshotValidation,
  validateAndNormalizeDeployers,
} from '@/lib/deployer-snapshots';
import { refreshTokenDeployments } from '@/lib/token-deployments';
import { invalidatePublicProfileCache } from '@/lib/profile';

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

  const url = new URL(req.url);
  const limitParam = Number(url.searchParams.get('limit') ?? '');
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(Math.floor(limitParam), 200) : 50;
  const skipEnrichment = url.searchParams.get('skipEnrichment') === '1';
  const deployers = await getTopDeployers(limit);
  const { valid, invalid } = validateAndNormalizeDeployers(deployers);
  const duneQueryId = Number.parseInt(process.env.DUNE_DEPLOYER_QUERY_ID ?? '', 10);
  const deployerSnapshots = (prisma as typeof prisma & {
    deployerSnapshot: {
      upsert: (args: unknown) => Promise<unknown>;
    };
  }).deployerSnapshot;

  const existingWallets = await prisma.wallet.findMany({
    where: { address: { in: valid.map((entry) => entry.walletAddress) } },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          bio: true,
          isClaimed: true,
        },
      },
    },
  });
  const walletByAddress = new Map(existingWallets.map((wallet) => [wallet.address, wallet]));

  let created = 0;
  let updated = 0;
  let enriched = 0;
  let warnings = 0;

  for (const snapshot of valid) {
    const existingWallet = walletByAddress.get(snapshot.walletAddress);
    let userId = existingWallet?.userId;
    let username = existingWallet?.user.username;
    let userClaimed = existingWallet?.user.isClaimed ?? false;

    if (!existingWallet) {
      const identity = buildUnclaimedDeployerIdentity(snapshot.walletAddress);
      const user = await prisma.user.create({
        data: {
          username: identity.username,
          displayName: identity.displayName,
          bio: buildDeployerBio(snapshot),
          isClaimed: false,
        },
      });

      const wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          address: snapshot.walletAddress,
          chain: 'solana',
          verified: false,
          isMain: true,
        },
      });

      walletByAddress.set(snapshot.walletAddress, {
        ...wallet,
        user,
      });

      userId = user.id;
      username = user.username;
      userClaimed = false;
      created++;
    } else {
      userId = existingWallet.userId;
      username = existingWallet.user.username;
      userClaimed = existingWallet.user.isClaimed;

      if (!userClaimed || !existingWallet.user.bio) {
        await prisma.user.update({
          where: { id: existingWallet.userId },
          data: {
            bio: buildDeployerBio(snapshot),
          },
        });
      }

      await prisma.wallet.update({
        where: { id: existingWallet.id },
        data: {
          isMain: true,
        },
      });

      updated++;
    }

    if (!userId || !username) continue;

    if (!skipEnrichment) {
      try {
        await refreshTokenDeployments(userId, [{ address: snapshot.walletAddress }]);
        enriched++;
      } catch {
        // Non-fatal; snapshot data is still useful for ranking.
      }
    }

    const localDeploymentCount = await prisma.tokenDeployment.count({
      where: { userId },
    });
    const reconciled = reconcileSnapshotValidation(snapshot, localDeploymentCount);
    if (reconciled.validationStatus === 'warning') warnings++;

    await deployerSnapshots.upsert({
      where: { walletAddress: snapshot.walletAddress },
      create: {
        userId,
        walletAddress: snapshot.walletAddress,
        source: 'dune',
        sourceQueryId: Number.isFinite(duneQueryId) ? duneQueryId : null,
        totalDeployed: snapshot.totalDeployed,
        totalMigrated: snapshot.totalMigrated,
        graduationRate: snapshot.graduationRate,
        tokens7d: snapshot.tokens7d,
        tokens30d: snapshot.tokens30d,
        validationStatus: reconciled.validationStatus,
        validationReason: reconciled.validationReason,
        syncedAt: new Date(),
        rawPayload: snapshot.rawPayload,
      },
      update: {
        userId,
        sourceQueryId: Number.isFinite(duneQueryId) ? duneQueryId : null,
        totalDeployed: snapshot.totalDeployed,
        totalMigrated: snapshot.totalMigrated,
        graduationRate: snapshot.graduationRate,
        tokens7d: snapshot.tokens7d,
        tokens30d: snapshot.tokens30d,
        validationStatus: reconciled.validationStatus,
        validationReason: reconciled.validationReason,
        syncedAt: new Date(),
        rawPayload: snapshot.rawPayload,
      },
    });

    await invalidatePublicProfileCache(username);
  }

  return NextResponse.json({
    ok: true,
    deployersFetched: deployers.length,
    deployersSynced: valid.length,
    created,
    updated,
    enriched,
    warnings,
    invalidRows: invalid,
    skipEnrichment,
  });
}
