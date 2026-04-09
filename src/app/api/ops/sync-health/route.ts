import { NextResponse } from 'next/server';
import { getWalletSyncHealthReport } from '@/lib/wallet-sync-health';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const sampleParam = Number(url.searchParams.get('sample') ?? '');
  const sample = Number.isFinite(sampleParam) && sampleParam > 0 ? Math.floor(sampleParam) : 10;

  const report = await getWalletSyncHealthReport(sample);
  return NextResponse.json(report);
}
