import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTokenMetadata, getWalletTransactions, getAssetsByOwner } from '@/lib/helius';
import { getSolPrice } from '@/lib/sol-price';
import { invalidatePublicProfileCache } from '@/lib/profile';
import { parseWalletTrades } from '@/lib/wallet-trade-parser';
import { recordWalletSyncFailure, recordWalletSyncSuccess } from '@/lib/wallet-sync-health';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { allowed } = await rateLimit(`wallet_sync:${ip}`, 10, 300); // Strict rate limit for sync
    if (!allowed) {
      return NextResponse.json({ error: 'Too many sync requests' }, { status: 429 });
    }

    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const targetAddress: string | undefined = body?.address;

    const wallets = await prisma.wallet.findMany({
      where: targetAddress
        ? { userId: session.id, address: targetAddress }
        : { userId: session.id },
    });

    if (wallets.length === 0) {
      return NextResponse.json({ ok: true, walletsUpdated: 0, newTrades: 0 });
    }

    // Fix 3: Add fallback for SOL price fetch
    let solPrice = 150; // fallback
    try {
      solPrice = await getSolPrice();
    } catch (err) {
      logger.warn('api/wallets/sync', 'Failed to fetch SOL price, using fallback', { error: String(err) });
    }

    let walletsUpdated = 0;
    let newTrades = 0;
    const failures: { address: string; error: string }[] = [];

    for (const wallet of wallets) {
      try {
        const attemptedAt = new Date();
        const {
          txns,
          newestSignature,
          oldestFetchedSignature,
          pagesFetched,
          previousCursorFound,
          reachedHistoryEnd,
          pageLimitReached,
        } = await getWalletTransactions(wallet.address, {
          since: wallet.lastSignature,
        });

        let tradeRows = 0;
        let eventRows = 0;
        let candidateTxCount = 0;
        let oldestExactEventAt: Date | null = null;

        if (txns.length > 0) {
          const parsed = parseWalletTrades(txns, wallet.address);
          const tokenMetadata = await getTokenMetadata(Array.from(parsed.aggregates.keys()));
          tradeRows = parsed.aggregates.size;
          eventRows = parsed.events.length;
          candidateTxCount = parsed.candidateTxCount;
          oldestExactEventAt =
            parsed.events.length > 0
              ? parsed.events.reduce(
                  (oldest, event) => {
                    const eventAt = new Date(event.timestamp * 1000);
                    return oldest == null || eventAt < oldest ? eventAt : oldest;
                  },
                  null as Date | null,
                )
              : null;
          newTrades += parsed.aggregates.size;

          for (const [tokenMint, data] of parsed.aggregates) {
            const meta = tokenMetadata.get(tokenMint);
            await prisma.walletTrade.upsert({
              where: { walletId_tokenMint: { walletId: wallet.id, tokenMint } },
              create: {
                walletId: wallet.id,
                tokenMint,
                tokenSymbol: meta?.symbol || tokenMint.slice(0, 6),
                tokenName: meta?.name || null,
                tokenImageUrl: meta?.image || null,
                buySol: data.buySol,
                sellSol: data.sellSol,
                pnlSol: data.sellSol - data.buySol,
                tradeCount: data.count,
                firstTradeAt: new Date(data.firstAt * 1000),
                lastTradeAt: new Date(data.lastAt * 1000),
              },
              update: {
                tokenSymbol: meta?.symbol || tokenMint.slice(0, 6),
                tokenName: meta?.name || null,
                tokenImageUrl: meta?.image || null,
                buySol: { increment: data.buySol },
                sellSol: { increment: data.sellSol },
                pnlSol: { increment: data.sellSol - data.buySol },
                tradeCount: { increment: data.count },
                lastTradeAt: new Date(data.lastAt * 1000),
                updatedAt: new Date(),
              },
            });
          }

          for (const event of parsed.events) {
            const meta = tokenMetadata.get(event.tokenMint);
            await prisma.walletTradeEvent.upsert({
              where: {
                walletId_signature_tokenMint_type: {
                  walletId: wallet.id,
                  signature: event.signature,
                  tokenMint: event.tokenMint,
                  type: event.type,
                },
              },
              create: {
                walletId: wallet.id,
                signature: event.signature,
                tokenMint: event.tokenMint,
                tokenSymbol: meta?.symbol || event.tokenMint.slice(0, 6),
                tokenName: meta?.name || null,
                tokenImageUrl: meta?.image || null,
                type: event.type,
                amountSol: event.amountSol,
                timestamp: new Date(event.timestamp * 1000),
              },
              update: {
                tokenSymbol: meta?.symbol || event.tokenMint.slice(0, 6),
                tokenName: meta?.name || null,
                tokenImageUrl: meta?.image || null,
                amountSol: event.amountSol,
                timestamp: new Date(event.timestamp * 1000),
              },
            });
          }
        }

        // Fetch current holdings via Helius DAS API
        const holdings = await getAssetsByOwner(wallet.address);
        if (holdings.length > 0) {
          const holdingMints = holdings.map((h) => h.mint);
          const holdingMetadata = await getTokenMetadata(holdingMints);

          for (const holding of holdings) {
            const meta = holdingMetadata.get(holding.mint);
            const valueUsd = holding.mint === 'So11111111111111111111111111111111111111112'
              ? (holding.amount / 1e9) * solPrice
              : null; // Only calculate USD for SOL; other tokens need price feeds

            await prisma.tokenHolding.upsert({
              where: { walletId_tokenMint: { walletId: wallet.id, tokenMint: holding.mint } },
              create: {
                walletId: wallet.id,
                tokenMint: holding.mint,
                tokenSymbol: meta?.symbol || holding.symbol,
                tokenName: meta?.name || holding.name,
                tokenImageUrl: meta?.image || holding.image,
                amount: holding.amount / Math.pow(10, holding.decimals),
                valueUsd,
              },
              update: {
                tokenSymbol: meta?.symbol || holding.symbol,
                tokenName: meta?.name || holding.name,
                tokenImageUrl: meta?.image || holding.image,
                amount: holding.amount / Math.pow(10, holding.decimals),
                valueUsd,
                lastUpdated: new Date(),
              },
            });
          }
        }

        await recordWalletSyncSuccess({
          walletId: wallet.id,
          syncMode: 'incremental',
          attemptedAt,
          successfulAt: new Date(),
          newestSignature,
          oldestFetchedSignature,
          previousSignature: wallet.lastSignature,
          txnsFetched: txns.length,
          candidateTxCount,
          tradeRows,
          eventRows,
          pagesFetched,
          previousCursorFound,
          reachedHistoryEnd,
          pageLimitReached,
          oldestExactEventAt,
        });

        walletsUpdated++;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown wallet sync error';
        logger.error('api/wallets/sync', `Failed to sync wallet ${wallet.address}`, error);
        await recordWalletSyncFailure({
          walletId: wallet.id,
          syncMode: 'incremental',
          error: message,
          previousSignature: wallet.lastSignature,
        });
        failures.push({ address: wallet.address, error: message });
      }
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

    await invalidatePublicProfileCache(session.username);

    return NextResponse.json({ 
      ok: failures.length < wallets.length, 
      walletsUpdated, 
      newTrades,
      failures: failures.length > 0 ? failures : undefined
    });
  } catch (err) {
    logger.error('api/wallets/sync', 'Critical failure during wallet sync', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
