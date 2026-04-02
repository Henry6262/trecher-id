import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getWalletTransactions } from '@/lib/helius';
import { getSolPrice } from '@/lib/sol-price';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

function parseSwaps(
  txns: Awaited<ReturnType<typeof getWalletTransactions>>['txns'],
  walletAddress: string,
) {
  const tokenMap = new Map<string, {
    buySol: number; sellSol: number; count: number;
    firstAt: number; lastAt: number;
  }>();

  for (const tx of txns) {
    if (tx.type !== 'SWAP') continue;

    const tokenTransfers = tx.tokenTransfers || [];
    const accountData = tx.accountData || [];

    const nonSolToken = tokenTransfers.find((t: { mint: string }) => t.mint !== SOL_MINT);
    if (!nonSolToken) continue;

    const tokenMint = nonSolToken.mint;
    const tokenReceived = nonSolToken.toUserAccount === walletAddress;
    const tokenSent = nonSolToken.fromUserAccount === walletAddress;
    if (!tokenReceived && !tokenSent) continue;

    const walletAccount = accountData.find((a: { account: string }) => a.account === walletAddress);
    const netSol = (walletAccount?.nativeBalanceChange ?? 0) / 1e9;

    if (!tokenMap.has(tokenMint)) {
      tokenMap.set(tokenMint, { buySol: 0, sellSol: 0, count: 0, firstAt: tx.timestamp, lastAt: tx.timestamp });
    }
    const entry = tokenMap.get(tokenMint)!;
    entry.firstAt = Math.min(entry.firstAt, tx.timestamp);
    entry.lastAt = Math.max(entry.lastAt, tx.timestamp);
    entry.count++;

    if (tokenReceived && netSol < -0.001) {
      entry.buySol += Math.abs(netSol);
    } else if (tokenSent && netSol > 0.001) {
      entry.sellSol += netSol;
    }
  }

  return tokenMap;
}

export async function POST() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wallets = await prisma.wallet.findMany({ where: { userId: session.id } });

    if (wallets.length === 0) {
      return NextResponse.json({ ok: true, walletsUpdated: 0, newTrades: 0 });
    }

    // Fix 3: Add fallback for SOL price fetch
    let solPrice = 150; // fallback
    try {
      solPrice = await getSolPrice();
    } catch {
      // use fallback
    }

    let walletsUpdated = 0;
    let newTrades = 0;

    for (const wallet of wallets) {
      const { txns, newestSignature } = await getWalletTransactions(wallet.address, {
        since: wallet.lastSignature,
      });

      if (txns.length > 0) {
        const swapMap = parseSwaps(txns, wallet.address);
        newTrades += swapMap.size;

        for (const [tokenMint, data] of swapMap) {
          await prisma.walletTrade.upsert({
            where: { walletId_tokenMint: { walletId: wallet.id, tokenMint } },
            create: {
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
            update: {
              buySol: { increment: data.buySol },
              sellSol: { increment: data.sellSol },
              pnlSol: { increment: data.sellSol - data.buySol },
              tradeCount: { increment: data.count },
              lastTradeAt: new Date(data.lastAt * 1000),
              updatedAt: new Date(),
            },
          });
        }

        await prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            lastSignature: newestSignature,
            lastFetchedAt: new Date(),
          },
        });
      }

      walletsUpdated++;
    }

    // Fix 1: Batch trade query after loop to eliminate N+1
    const allTrades = await prisma.walletTrade.findMany({
      where: { walletId: { in: wallets.map(w => w.id) } },
    });

    // Group by walletId manually
    const tradesByWallet = new Map<string, typeof allTrades>();
    for (const t of allTrades) {
      const arr = tradesByWallet.get(t.walletId) ?? [];
      arr.push(t);
      tradesByWallet.set(t.walletId, arr);
    }

    // Update stats for each wallet using grouped data
    for (const wallet of wallets) {
      const wTrades = tradesByWallet.get(wallet.id) ?? [];
      const totalTrades = wTrades.reduce((s, t) => s + t.tradeCount, 0);
      // Fix 2: winRate by trade count not token count
      const wins = wTrades.reduce((s, t) => s + (t.pnlSol > 0 ? t.tradeCount : 0), 0);
      const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
      const totalPnlSol = wTrades.reduce((s, t) => s + t.pnlSol, 0);
      const totalPnlUsd = totalPnlSol * solPrice;

      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { totalPnlUsd, winRate, totalTrades },
      });
    }

    return NextResponse.json({ ok: true, walletsUpdated, newTrades });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[wallets/sync] Error:', err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
