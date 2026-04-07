import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { invalidatePublicProfileCache } from '@/lib/profile';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { address } = await req.json();
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 });

  // Verify the wallet belongs to the user
  const wallet = await prisma.wallet.findUnique({
    where: { userId_address: { userId: session.id, address } },
  });
  if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });

  // Clear isMain on all user wallets, then set the target
  await prisma.wallet.updateMany({
    where: { userId: session.id },
    data: { isMain: false },
  });

  const updated = await prisma.wallet.update({
    where: { id: wallet.id },
    data: { isMain: true },
  });

  await invalidatePublicProfileCache(session.username);
  return NextResponse.json(updated);
}
