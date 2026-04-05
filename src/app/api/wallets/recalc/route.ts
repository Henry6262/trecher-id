import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWalletTransactions } from '@/lib/helius';
import { getSolPrice } from '@/lib/sol-price';

export const maxDuration = 300;

const SOL_MINT = 'So11111111111111111111111111111111111111112';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseSwapsForRecalc(
  txns: Awaited<ReturnType<typeof getWalletTransactions>>['txns'],
  walletAddress: string,
) {
  const tokenMap = new Map<string, {
    buySol: number; sellSol: number; count: number;
    firstAt: number; lastAt: number;
  }>();

  for (const tx of txns) {
    if (tx.type !== 'SWAP' && tx.type !== 'TRANSFER' && tx.type !== 'UNKNOWN') continue;

    const tokenTransfers = tx.tokenTransfers || [];
    const nativeTransfers = tx.nativeTransfers || [];
    const accountData = tx.accountData || [];

    const nonSolTokens = tokenTransfers.filter(t => t.mint !== SOL_MINT);
    if (nonSolTokens.length === 0) continue;

    if (tx.type !== 'SWAP') {
      const hasNativeFlow = nativeTransfers.some(n => n.fromUserAccount === walletAddress || n.toUserAccount === walletAddress);
      if (!hasNativeFlow) continue;
    }

    let solSpent = 0;
    let solReceived = 0;
    for (const nt of nativeTransfers) {
      const amountSol = nt.amount / 1e9;
      if (nt.fromUserAccount === walletAddress) solSpent += amountSol;
      if (nt.toUserAccount === walletAddress) solReceived += amountSol;
    }
    const netSol = solReceived - solSpent;
    const effectiveNetSol = (solSpent === 0 && solReceived === 0)
      ? (accountData.find(a => a.account === walletAddress)?.nativeBalanceChange ?? 0) / 1e9
      : netSol;

    for (const token of nonSolTokens) {
      const tokenMint = token.mint;
      const tokenReceived = token.toUserAccount === walletAddress;
      const tokenSent = token.fromUserAccount === walletAddress;
      if (!tokenReceived && !tokenSent) continue;

      if (!tokenMap.has(tokenMint)) {
        tokenMap.set(tokenMint, { buySol: 0, sellSol: 0, count: 0, firstAt: tx.timestamp, lastAt: tx.timestamp });
      }
      const entry = tokenMap.get(tokenMint)!;
      entry.firstAt = Math.min(entry.firstAt, tx.timestamp);
      entry.lastAt = Math.max(entry.lastAt, tx.timestamp);
      entry.count++;

      if (tokenReceived && effectiveNetSol < -0.0001) {
        entry.buySol += Math.abs(effectiveNetSol);
      } else if (tokenSent && effectiveNetSol > 0.0001) {
        entry.sellSol += effectiveNetSol;
      }

      break;
    }
  }

  return tokenMap;
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const walletAddress = searchParams.get('wallet');
  const solPrice = await getSolPrice();

  const wallets = walletAddress
    ? await prisma.wallet.findMany({ where: { address: walletAddress }, include: { user: true } })
    : await prisma.wallet.findMany({ include: { user: true } });

  const results: { wallet: string; before: number; after: number; trades: number }[] = [];

  for (const wallet of wallets) {
    const beforeTrades = await prisma.walletTrade.findMany({
      where: { walletId: wallet.id },
    });
    const beforePnl = beforeTrades.reduce((s, t) => s + t.pnlSol, 0);

    await prisma.walletTrade.deleteMany({ where: { walletId: wallet.id } });

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { lastSignature: null, lastFetchedAt: null },
    });

    const { txns, newestSignature } = await getWalletTransactions(wallet.address, {
      maxPages: 50,
    });

    const swapMap = parseSwapsForRecalc(txns, wallet.address);

    for (const [tokenMint, data] of swapMap) {
      await prisma.walletTrade.create({
        data: {
          walletId: wallet.id,
          tokenMint,
          tokenSymbol: tokenMint.slice(0, 6),
          buySol: data.buySol,
          sellSol: data.sellSol,
          pnlSol: data.sellSol - data.buySol,
          tradeCount: data.count,
          firstTradeAt: new Date(data.firstAt * 1000),
          lastTradeAt: new Date(data.lastAt * 1000),
        },
      });
    }

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { lastSignature: newestSignature, lastFetchedAt: new Date() },
    });

    const allTrades = await prisma.walletTrade.findMany({
      where: { wallet: { userId: wallet.userId } },
    });

    const now = Date.now();
    const periods = [
      { key: '1d', ms: 1 * 86400 * 1000 },
      { key: '3d', ms: 3 * 86400 * 1000 },
      { key: '7d', ms: 7 * 86400 * 1000 },
      { key: '14d', ms: 14 * 86400 * 1000 },
    ] as const;

    for (const period of periods) {
      const cutoff = new Date(now - period.ms);
      const periodTrades = allTrades.filter(t => t.lastTradeAt >= cutoff);
      const pnlSol = periodTrades.reduce((s, t) => s + t.pnlSol, 0);
      const totalTrades = periodTrades.reduce((s, t) => s + t.tradeCount, 0);
      const wins = periodTrades.reduce((s, t) => s + (t.pnlSol > 0 ? t.tradeCount : 0), 0);
      const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

      await prisma.userRanking.upsert({
        where: { userId_period: { userId: wallet.userId, period: period.key } },
        create: { userId: wallet.userId, period: period.key, pnlSol, pnlUsd: pnlSol * solPrice, winRate, trades: totalTrades },
        update: { pnlSol, pnlUsd: pnlSol * solPrice, winRate, trades: totalTrades, updatedAt: new Date() },
      });
    }

    const allPnlSol = allTrades.reduce((s, t) => s + t.pnlSol, 0);
    const allTradeCount = allTrades.reduce((s, t) => s + t.tradeCount, 0);
    const allWins = allTrades.reduce((s, t) => s + (t.pnlSol > 0 ? t.tradeCount : 0), 0);
    const allWR = allTradeCount > 0 ? (allWins / allTradeCount) * 100 : 0;

    await prisma.userRanking.upsert({
      where: { userId_period: { userId: wallet.userId, period: 'all' } },
      create: { userId: wallet.userId, period: 'all', pnlSol: allPnlSol, pnlUsd: allPnlSol * solPrice, winRate: allWR, trades: allTradeCount },
      update: { pnlSol: allPnlSol, pnlUsd: allPnlSol * solPrice, winRate: allWR, trades: allTradeCount, updatedAt: new Date() },
    });

    results.push({
      wallet: wallet.address,
      before: Math.round(beforePnl * 100) / 100,
      after: Math.round(allPnlSol * 100) / 100,
      trades: swapMap.size,
    });

    await sleep(3000);
  }

  return NextResponse.json({
    ok: true,
    walletsProcessed: results.length,
    results,
    solPrice,
  });
}
