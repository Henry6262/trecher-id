import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');

  // Public access by username
  if (username) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        tokenDeployments: { orderBy: { deployedAt: 'desc' } },
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ deployments: user.tokenDeployments });
  }

  // Authenticated user's own deployments
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deployments = await prisma.tokenDeployment.findMany({
    where: { userId: session.id },
    orderBy: { deployedAt: 'desc' },
  });

  return NextResponse.json({ deployments });
}
