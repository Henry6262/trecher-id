import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { validateProfileUpdate } from '@/lib/profile-validation';
import { invalidatePublicProfileCache } from '@/lib/profile';
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

  const body = await req.json();
  const result = validateProfileUpdate(body);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.id },
    data: result.updates,
    select: { id: true, username: true, displayName: true, bio: true, avatarUrl: true, accentColor: true, bannerUrl: true },
  });
  await invalidatePublicProfileCache(user.username);
  return NextResponse.json(user);
}
