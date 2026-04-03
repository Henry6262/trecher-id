import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, username: true, displayName: true, bio: true, avatarUrl: true, accentColor: true, bannerUrl: true },
  });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { bio, displayName, accentColor, bannerUrl } = await req.json();
  const user = await prisma.user.update({
    where: { id: session.id },
    data: {
      ...(bio !== undefined && { bio }),
      ...(displayName !== undefined && { displayName }),
      ...(accentColor !== undefined && { accentColor }),
      ...(bannerUrl !== undefined && { bannerUrl }),
    },
    select: { id: true, username: true, displayName: true, bio: true, avatarUrl: true, accentColor: true, bannerUrl: true },
  });
  return NextResponse.json(user);
}
