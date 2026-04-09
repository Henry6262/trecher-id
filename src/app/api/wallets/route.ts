import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { invalidatePublicProfileCache } from '@/lib/profile';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const wallets = await prisma.wallet.findMany({
    where: { userId: session.id },
    orderBy: { linkedAt: 'asc' },
    select: {
      id: true,
      address: true,
      chain: true,
      verified: true,
      linkedAt: true,
      totalPnlUsd: true,
      winRate: true,
      totalTrades: true,
      lastSuccessfulSyncAt: true,
      lastSyncStatus: true,
      lastSyncError: true,
      lastSyncTxnsFetched: true,
      lastSyncTradeRows: true,
      lastSyncEventRows: true,
      syncWarningCode: true,
      lastContinuityStatus: true,
      lastContinuityIssue: true,
      historyCoverageStatus: true,
      historyCoverageIssue: true,
      historyCoverageUpdatedAt: true,
      oldestExactEventAt: true,
    },
  });
  return NextResponse.json(wallets);
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { address } = await req.json();
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 });

  const wallet = await prisma.wallet.upsert({
    where: { userId_address: { userId: session.id, address } },
    update: {},
    create: { userId: session.id, address, chain: 'solana', verified: true },
  });
  await invalidatePublicProfileCache(session.username);
  return NextResponse.json(wallet, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { address } = await req.json();
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 });

  await prisma.wallet.deleteMany({ where: { userId: session.id, address } });
  await invalidatePublicProfileCache(session.username);
  return NextResponse.json({ ok: true });
}
