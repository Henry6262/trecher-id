import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;

interface DASAsset {
  id: string;
  content?: {
    metadata?: { symbol?: string; name?: string };
    links?: { image?: string };
    files?: { uri?: string }[];
  };
  token_info?: {
    balance?: number;
    decimals?: number;
    price_info?: {
      price_per_token?: number;
      total_price?: number;
      currency?: string;
    };
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { username },
    select: { wallets: { select: { address: true } } },
  });
  if (!user || user.wallets.length === 0) return NextResponse.json([]);

  // Fetch fungible token holdings for all wallets
  const holdings: {
    mint: string;
    symbol: string;
    name: string;
    image: string | null;
    balance: number;
    valueUsd: number;
  }[] = [];

  for (const wallet of user.wallets) {
    try {
      const res = await fetch(HELIUS_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'portfolio',
          method: 'getAssetsByOwner',
          params: {
            ownerAddress: wallet.address,
            displayOptions: { showFungible: true, showNativeBalance: true },
          },
        }),
      });

      if (!res.ok) continue;
      const data = await res.json();
      const assets: DASAsset[] = data.result?.items ?? [];

      for (const asset of assets) {
        const tokenInfo = asset.token_info;
        if (!tokenInfo?.balance || !tokenInfo?.decimals) continue;

        const balance = tokenInfo.balance / Math.pow(10, tokenInfo.decimals);
        if (balance < 0.001) continue;

        const valueUsd = tokenInfo.price_info?.total_price ?? 0;
        // Skip dust (< $0.01)
        if (valueUsd < 0.01 && balance < 1) continue;

        const symbol = asset.content?.metadata?.symbol || asset.id.slice(0, 6);
        const name = asset.content?.metadata?.name || symbol;
        const image = asset.content?.links?.image || asset.content?.files?.[0]?.uri || null;

        // Merge with existing holding if same mint across wallets
        const existing = holdings.find(h => h.mint === asset.id);
        if (existing) {
          existing.balance += balance;
          existing.valueUsd += valueUsd;
        } else {
          holdings.push({ mint: asset.id, symbol, name, image, balance, valueUsd });
        }
      }
    } catch {
      // Skip failed wallet
    }
  }

  // Sort by USD value descending
  holdings.sort((a, b) => b.valueUsd - a.valueUsd);

  return NextResponse.json(holdings.slice(0, 20), {
    headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
  });
}
