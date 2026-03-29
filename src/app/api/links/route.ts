import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const links = await prisma.link.findMany({
    where: { userId: session.id },
    orderBy: { order: 'asc' },
  });
  return NextResponse.json(links);
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, url, icon } = await req.json();
  if (!title || !url) return NextResponse.json({ error: 'title and url required' }, { status: 400 });

  const maxOrder = await prisma.link.aggregate({
    where: { userId: session.id },
    _max: { order: true },
  });
  const link = await prisma.link.create({
    data: {
      userId: session.id,
      title,
      url,
      icon: icon ?? null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });
  return NextResponse.json(link, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, title, url, icon, order } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const link = await prisma.link.updateMany({
    where: { id, userId: session.id },
    data: {
      ...(title !== undefined && { title }),
      ...(url !== undefined && { url }),
      ...(icon !== undefined && { icon }),
      ...(order !== undefined && { order }),
    },
  });
  return NextResponse.json(link);
}

export async function DELETE(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await prisma.link.deleteMany({ where: { id, userId: session.id } });
  return NextResponse.json({ ok: true });
}
