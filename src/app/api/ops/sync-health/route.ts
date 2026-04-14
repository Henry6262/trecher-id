import { NextResponse } from 'next/server';
import { getDeployerSyncHealthReport } from '@/lib/deployer-sync-health';
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
  const scope = url.searchParams.get('scope') ?? 'all';

  if (scope === 'wallet') {
    const report = await getWalletSyncHealthReport(sample);
    return NextResponse.json(report);
  }

  if (scope === 'deployer') {
    const report = await getDeployerSyncHealthReport(sample);
    return NextResponse.json(report);
  }

  const [walletSync, deployerSync] = await Promise.all([
    getWalletSyncHealthReport(sample),
    getDeployerSyncHealthReport(sample),
  ]);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    walletSync,
    deployerSync,
  });
}
