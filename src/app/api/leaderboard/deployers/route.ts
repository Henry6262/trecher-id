import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveAvatarRows } from '@/lib/avatar-resolution';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '50', 10) || 50, 1), 100);
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10) || 0, 0);

  // Aggregate token deployments by user — rank by total dev PnL
  const users = await prisma.user.findMany({
    where: { tokenDeployments: { some: {} } },
    select: {
      username: true,
      displayName: true,
      avatarUrl: true,
      isClaimed: true,
      tokenDeployments: true,
      _count: { select: { tokenDeployments: true } },
    },
    take: limit,
    skip: offset,
  });

  const ranked = users.map(u => {
    const deploys = u.tokenDeployments;
    const totalDevPnlSol = deploys.reduce((s, d) => s + (d.devPnlSol ?? 0), 0);
    const totalDevPnlUsd = deploys.reduce((s, d) => s + (d.devPnlUsd ?? 0), 0);
    const migrated = deploys.filter(d => d.status === 'migrated').length;
    const bestDeploy = deploys.reduce((best, d) => (!best || (d.devPnlSol ?? 0) > (best.devPnlSol ?? 0)) ? d : best, deploys[0]);

    return {
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      isClaimed: u.isClaimed,
      totalDevPnlSol,
      totalDevPnlUsd,
      deployCount: u._count.tokenDeployments,
      migratedCount: migrated,
      bestToken: bestDeploy?.tokenSymbol ?? null,
      bestTokenPnl: bestDeploy?.devPnlSol ?? 0,
    };
  });

  // Sort by total dev PnL descending
  ranked.sort((a, b) => b.totalDevPnlSol - a.totalDevPnlSol);

  const data = await resolveAvatarRows(ranked.map((r, i) => ({ ...r, rank: offset + i + 1 })));

  return NextResponse.json(data);
}
