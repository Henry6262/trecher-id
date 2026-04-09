import { NextResponse } from 'next/server';
import { getPublicProfileData } from '@/lib/profile';

interface PnlHistoryResponse {
  source: 'exact_helius' | 'derived_aggregates' | 'unavailable';
  series: { time: string; value: number }[];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 });

  const profile = await getPublicProfileData(username);
  if (!profile) return NextResponse.json({ error: 'not found' }, { status: 404 });

  if (profile.dataProvenance.eventSource !== 'exact_helius') {
    return NextResponse.json(
      {
        source: profile.dataProvenance.eventSource,
        series: [],
      } satisfies PnlHistoryResponse,
      {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
      },
    );
  }

  const dailyMap = new Map<string, number>();

  for (const trade of profile.allTrades) {
    for (const txn of trade.transactions) {
      const day = new Date(txn.timestamp * 1000).toISOString().slice(0, 10);
      const signedAmount = txn.type === 'BUY' ? -txn.amountSol : txn.amountSol;
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + signedAmount);
    }
  }

  let cumulative = 0;
  const series = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, pnl]) => {
      cumulative += pnl;
      return { time, value: Math.round(cumulative * 100) / 100 };
    });

  const response: PnlHistoryResponse = {
    source: profile.dataProvenance.eventSource,
    series,
  };

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
