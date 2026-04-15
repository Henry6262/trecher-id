import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { invalidatePublicProfileCache } from '@/lib/profile';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pinned = await prisma.pinnedTrade.findMany({
    where: { userId: session.id },
    orderBy: { order: 'asc' },
  });
  return NextResponse.json(pinned);
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const {
    walletAddress,
    tokenMint,
    tokenSymbol,
    tokenName,
    totalPnlPercent,
    totalPnlSol,
    transactions,
  } = await req.json();

  if (!walletAddress || !tokenMint || !tokenSymbol) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const maxOrder = await prisma.pinnedTrade.aggregate({
    where: { userId: session.id },
    _max: { order: true },
  });

  const pinned = await prisma.pinnedTrade.create({
    data: {
      userId: session.id,
      walletAddress,
      tokenMint,
      tokenSymbol,
      tokenName: tokenName ?? null,
      totalPnlPercent: totalPnlPercent ?? null,
      totalPnlSol: totalPnlSol ?? 0,
      order: (maxOrder._max.order ?? -1) + 1,
      transactions: transactions ?? [],
    },
  });

  await invalidatePublicProfileCache(session.username);
  return NextResponse.json(pinned, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await prisma.pinnedTrade.deleteMany({ where: { id, userId: session.id } });
  await invalidatePublicProfileCache(session.username);
  return NextResponse.json({ ok: true });
}
