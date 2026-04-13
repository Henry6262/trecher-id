import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveAvatarRows } from '@/lib/avatar-resolution';

type DeploymentSummary = {
  tokenSymbol: string;
  deployedAt: Date;
  status: string;
  devPnlSol: number | null;
  devPnlUsd: number | null;
};

function pickBestDeployment(deployments: DeploymentSummary[]): DeploymentSummary | null {
  if (deployments.length === 0) return null;

  const withPnl = deployments
    .filter((deployment) => deployment.devPnlSol != null)
    .sort((a, b) => (b.devPnlSol ?? 0) - (a.devPnlSol ?? 0));

  if (withPnl.length > 0) return withPnl[0];

  const migrated = deployments
    .filter((deployment) => deployment.status === 'migrated')
    .sort((a, b) => b.deployedAt.getTime() - a.deployedAt.getTime());

  if (migrated.length > 0) return migrated[0];

  return deployments
    .slice()
    .sort((a, b) => b.deployedAt.getTime() - a.deployedAt.getTime())[0] ?? null;
}

function mapSnapshotRows(rows: Array<{
  walletAddress: string;
  totalDeployed: number;
  totalMigrated: number;
  graduationRate: number;
  tokens7d: number;
  tokens30d: number;
  validationStatus: string;
  validationReason: string | null;
  syncedAt: Date;
  user: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
    isClaimed: boolean;
    tokenDeployments: DeploymentSummary[];
  };
}>) {
  return rows.map((row) => {
    const deployments = row.user.tokenDeployments;
    const totalDevPnlSol = deployments.reduce((sum, deployment) => sum + (deployment.devPnlSol ?? 0), 0);
    const totalDevPnlUsd = deployments.reduce((sum, deployment) => sum + (deployment.devPnlUsd ?? 0), 0);
    const bestDeployment = pickBestDeployment(deployments);

    return {
      username: row.user.username,
      displayName: row.user.displayName,
      avatarUrl: row.user.avatarUrl,
      isClaimed: row.user.isClaimed,
      walletAddress: row.walletAddress,
      totalDevPnlSol,
      totalDevPnlUsd,
      deployCount: row.totalDeployed,
      migratedCount: row.totalMigrated,
      graduationRate: row.graduationRate,
      tokens7d: row.tokens7d,
      tokens30d: row.tokens30d,
      bestToken: bestDeployment?.tokenSymbol ?? null,
      bestTokenPnl: bestDeployment?.devPnlSol ?? 0,
      validationStatus: row.validationStatus,
      validationReason: row.validationReason,
      syncedAt: row.syncedAt.toISOString(),
    };
  });
}

async function getDuneRankedDeployers(limit: number, offset: number) {
  const deployerSnapshots = (prisma as typeof prisma & {
    deployerSnapshot: {
      findMany: (args: unknown) => Promise<Array<{
        walletAddress: string;
        totalDeployed: number;
        totalMigrated: number;
        graduationRate: number;
        tokens7d: number;
        tokens30d: number;
        validationStatus: string;
        validationReason: string | null;
        syncedAt: Date;
        user: {
          username: string;
          displayName: string;
          avatarUrl: string | null;
          isClaimed: boolean;
          tokenDeployments: DeploymentSummary[];
        };
      }>>;
    };
  }).deployerSnapshot;

  const snapshots = await deployerSnapshots.findMany({
    where: {
      validationStatus: { not: 'invalid' },
    },
    include: {
      user: {
        select: {
          username: true,
          displayName: true,
          avatarUrl: true,
          isClaimed: true,
          tokenDeployments: {
            select: {
              tokenSymbol: true,
              deployedAt: true,
              status: true,
              devPnlSol: true,
              devPnlUsd: true,
            },
            orderBy: { deployedAt: 'desc' },
          },
        },
      },
    },
    orderBy: [
      { totalMigrated: 'desc' },
      { tokens7d: 'desc' },
      { graduationRate: 'desc' },
      { totalDeployed: 'desc' },
      { syncedAt: 'desc' },
    ],
    take: limit,
    skip: offset,
  });

  if (snapshots.length === 0) return [];

  const data = mapSnapshotRows(snapshots);
  return resolveAvatarRows(data.map((row, index) => ({ ...row, rank: offset + index + 1 })));
}

async function getLegacyDeployers(limit: number, offset: number) {
  const users = await prisma.user.findMany({
    where: { tokenDeployments: { some: {} } },
    select: {
      username: true,
      displayName: true,
      avatarUrl: true,
      isClaimed: true,
      tokenDeployments: {
        select: {
          tokenSymbol: true,
          deployedAt: true,
          status: true,
          devPnlSol: true,
          devPnlUsd: true,
        },
      },
      _count: { select: { tokenDeployments: true } },
    },
    take: limit,
    skip: offset,
  });

  const ranked = users.map((user) => {
    const totalDevPnlSol = user.tokenDeployments.reduce((sum, deployment) => sum + (deployment.devPnlSol ?? 0), 0);
    const totalDevPnlUsd = user.tokenDeployments.reduce((sum, deployment) => sum + (deployment.devPnlUsd ?? 0), 0);
    const migratedCount = user.tokenDeployments.filter((deployment) => deployment.status === 'migrated').length;
    const bestDeployment = pickBestDeployment(user.tokenDeployments);

    return {
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      isClaimed: user.isClaimed,
      walletAddress: null,
      totalDevPnlSol,
      totalDevPnlUsd,
      deployCount: user._count.tokenDeployments,
      migratedCount,
      graduationRate: user._count.tokenDeployments > 0 ? (migratedCount / user._count.tokenDeployments) * 100 : 0,
      tokens7d: 0,
      tokens30d: 0,
      bestToken: bestDeployment?.tokenSymbol ?? null,
      bestTokenPnl: bestDeployment?.devPnlSol ?? 0,
      validationStatus: 'legacy',
      validationReason: 'fallback_token_deployments_only',
      syncedAt: null,
    };
  });

  ranked.sort((a, b) => {
    if (b.migratedCount !== a.migratedCount) return b.migratedCount - a.migratedCount;
    if (b.deployCount !== a.deployCount) return b.deployCount - a.deployCount;
    return b.totalDevPnlSol - a.totalDevPnlSol;
  });

  return resolveAvatarRows(ranked.map((row, index) => ({ ...row, rank: offset + index + 1 })));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '50', 10) || 50, 1), 100);
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10) || 0, 0);

  const duneRanked = await getDuneRankedDeployers(limit, offset);
  if (duneRanked.length > 0) {
    return NextResponse.json(duneRanked);
  }

  const legacyRanked = await getLegacyDeployers(limit, offset);
  return NextResponse.json(legacyRanked);
}
