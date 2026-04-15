
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getUserRewards } from '@/lib/vault';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rewards = await getUserRewards(session.id);
    return NextResponse.json(rewards);
  } catch (error: any) {
    console.error('[api/profile/rewards] error:', error);
    return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
  }
}
