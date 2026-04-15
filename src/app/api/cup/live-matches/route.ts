import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWalletTransactions } from '@/lib/helius';
import { parseWalletTrades } from '@/lib/wallet-trade-parser';

import { getSolPrice } from '@/lib/sol-price';

export const dynamic = 'force-dynamic';

/**
 * Live match PnL tracker — polls Helius for real-time match data.
 * No cron dependency — runs on-demand during active tournament phases.
 */
export async function GET() {
  try {
    // Get current active season
    const season = await prisma.cupSeason.findFirst({
      where: { status: { not: 'draft' } },
      orderBy: { createdAt: 'desc' },
    });

    if (!season) {
      return NextResponse.json({ error: 'No active season' }, { status: 404 });
    }

    // Get all active matches (scheduled or live)
    const matches = await prisma.cupMatch.findMany({
      where: {
        seasonId: season.id,
        status: { in: ['scheduled', 'live'] },
      },
      orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }],
    });

    if (matches.length === 0) {
      return NextResponse.json({
        season: { name: season.name, status: season.status },
        matches: [],
        message: 'No active matches right now',
      });
    }

    // For each match, fetch live PnL from Helius
    const liveMatches = await Promise.all(
      matches.map(async (match) => {
        const result: Record<string, unknown> = {
          id: match.id,
          round: match.round,
          matchNumber: match.matchNumber,
          status: match.status,
          windowStart: match.windowStart,
          windowEnd: match.windowEnd,
          participant1: null,
          participant2: null,
          winnerId: match.winnerId,
        };

        // Fetch PnL for participant 1
        if (match.participant1Id) {
          result.participant1 = await getParticipantLivePnl(
            match.participant1Id,
          );
        }

        // Fetch PnL for participant 2
        if (match.participant2Id) {
          result.participant2 = await getParticipantLivePnl(
            match.participant2Id,
          );
        }

        // Determine current leader
        const p1 = result.participant1 as { pnlUsd: number } | null;
        const p2 = result.participant2 as { pnlUsd: number } | null;

        if (p1 && p2) {
          (result as Record<string, unknown>).leader =
            p1.pnlUsd > p2.pnlUsd
              ? match.participant1Id
              : p2.pnlUsd > p1.pnlUsd
              ? match.participant2Id
              : 'tied';

          (result as Record<string, unknown>).leadMargin = Math.abs(p1.pnlUsd - p2.pnlUsd);
        }

        return result;
      }),
    );

    return NextResponse.json({
      season: {
        name: season.name,
        status: season.status,
        prizePoolUsd: season.prizePoolUsd,
      },
      matches: liveMatches,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[cup/live-matches] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live matches' },
      { status: 500 }
    );
  }
}

/**
 * Get a participant's live PnL by fetching recent transactions from Helius.
 */
async function getParticipantLivePnl(
  participantId: string,
) {
  try {
    // Get participant's wallets
    const participant = await prisma.cupParticipant.findUnique({
      where: { id: participantId },
      include: { user: { include: { wallets: true } } },
    });

    if (!participant || participant.user.wallets.length === 0) {
      return {
        id: participantId,
        username: participant?.user.username ?? 'unknown',
        displayName: participant?.user.displayName ?? 'Unknown',
        pnlUsd: 0,
        pnlSol: 0,
        trades: 0,
        winRate: 0,
        recentTxns: 0,
        lastUpdated: new Date().toISOString(),
      };
    }

    let totalPnlSol = 0;
    let totalTrades = 0;
    let wins = 0;
    let recentTxns = 0;

    // Fetch recent transactions from Helius for each wallet
    for (const wallet of participant.user.wallets) {
      try {
        const { txns } = await getWalletTransactions(wallet.address, {
          since: wallet.lastSignature,
          maxPages: 3, // Limit to 3 pages for speed
        });

        if (txns.length > 0) {
          const parsed = parseWalletTrades(txns, wallet.address);
          recentTxns += txns.length;

          // Calculate PnL for trades within window
          for (const trade of parsed.aggregates.values()) {
            const pnl = trade.sellSol - trade.buySol;
            totalPnlSol += pnl;
            totalTrades += trade.count;
            if (pnl > 0) wins += trade.count;
          }
        }
      } catch (err) {
        console.error(`[live-pnl] Error fetching ${wallet.address}:`, err);
      }
    }

    const solPrice = await getSolPrice(); // Fetch live price from Redis/API

    return {
      id: participantId,
      username: participant.user.username,
      displayName: participant.user.displayName,
      pnlSol: totalPnlSol,
      pnlUsd: totalPnlSol * solPrice,
      trades: totalTrades,
      winRate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
      recentTxns,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[live-pnl] Error:', error);
    return {
      id: participantId,
      username: 'error',
      displayName: 'Error',
      pnlUsd: 0,
      pnlSol: 0,
      trades: 0,
      winRate: 0,
      recentTxns: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}
