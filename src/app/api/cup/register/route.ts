import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in with Twitter/X to register' },
        { status: 401 }
      );
    }

    // Get Season 1
    const season = await prisma.cupSeason.findUnique({
      where: { slug: 'season-1' },
    });

    if (!season) {
      return NextResponse.json(
        { error: 'No active season', message: 'Season 1 has not started yet' },
        { status: 404 }
      );
    }

    // Check if already registered
    const existing = await prisma.cupParticipant.findUnique({
      where: {
        seasonId_userId: {
          seasonId: season.id,
          userId: session.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        registered: true,
        status: existing.currentRound,
        rank: existing.seed,
        group: existing.group,
        qualificationPnlUsd: existing.qualificationPnlUsd,
        qualificationTrades: existing.qualificationTrades,
        message: existing.currentRound === 'eliminated'
          ? 'You were eliminated from this season'
          : `You're registered! Currently in ${existing.currentRound} round`,
      });
    }

    // Check qualification: count trades in qualification window
    const userWallets = await prisma.wallet.findMany({
      where: { userId: session.id },
      include: {
        trades: {
          where: {
            firstTradeAt: { gte: season.qualificationStart },
            lastTradeAt: { lte: season.qualificationEnd },
          },
        },
      },
    });

    let totalPnlSol = 0;
    let totalTrades = 0;

    for (const wallet of userWallets) {
      for (const trade of wallet.trades) {
        totalPnlSol += trade.pnlSol;
        totalTrades += trade.tradeCount;
      }
    }

    const solPrice = 150; // Fallback, would normally fetch from API
    const pnlUsd = totalPnlSol * solPrice;

    // Check eligibility: need at least 10 trades
    const eligible = totalTrades >= 10;

    return NextResponse.json({
      registered: false,
      eligible,
      totalTrades,
      pnlUsd,
      pnlSol: totalPnlSol,
      walletCount: userWallets.length,
      minTradesRequired: 10,
      message: eligible
        ? 'You qualify! Click register to join Season 1.'
        : `Need ${10 - totalTrades} more trades to qualify. Keep trading!`,
    });
  } catch (error) {
    console.error('[cup/register] Error:', error);
    return NextResponse.json(
      { error: 'Internal error', message: 'Failed to check registration status' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in with Twitter/X first' },
        { status: 401 }
      );
    }

    const season = await prisma.cupSeason.findUnique({
      where: { slug: 'season-1' },
    });

    if (!season) {
      return NextResponse.json(
        { error: 'No active season', message: 'Season 1 has not started yet' },
        { status: 404 }
      );
    }

    if (season.status !== 'qualifying') {
      return NextResponse.json(
        { error: 'Registration closed', message: `Season 1 is now in "${season.status}" phase. Registration is closed.` },
        { status: 400 }
      );
    }

    // Check if already registered
    const existing = await prisma.cupParticipant.findUnique({
      where: {
        seasonId_userId: {
          seasonId: season.id,
          userId: session.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Already registered', message: 'You are already registered for Season 1' },
        { status: 400 }
      );
    }

    // Check qualification
    const userWallets = await prisma.wallet.findMany({
      where: { userId: session.id },
      include: {
        trades: {
          where: {
            firstTradeAt: { gte: season.qualificationStart },
            lastTradeAt: { lte: season.qualificationEnd },
          },
        },
      },
    });

    if (userWallets.length === 0) {
      return NextResponse.json(
        { error: 'No wallets', message: 'Link a Solana wallet in your dashboard first' },
        { status: 400 }
      );
    }

    let totalPnlSol = 0;
    let totalTrades = 0;

    for (const wallet of userWallets) {
      for (const trade of wallet.trades) {
        totalPnlSol += trade.pnlSol;
        totalTrades += trade.tradeCount;
      }
    }

    if (totalTrades < 10) {
      return NextResponse.json(
        { error: 'Not enough trades', message: `Need 10 trades to qualify. You have ${totalTrades}.` },
        { status: 400 }
      );
    }

    const solPrice = 150;
    const pnlUsd = totalPnlSol * solPrice;

    // Register the user
    const participant = await prisma.cupParticipant.create({
      data: {
        seasonId: season.id,
        userId: session.id,
        qualificationPnlUsd: pnlUsd,
        qualificationPnlSol: totalPnlSol,
        qualificationTrades: totalTrades,
        currentRound: 'qualified',
      },
    });

    // Update season participant count
    await prisma.cupSeason.update({
      where: { id: season.id },
      data: { participantCount: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      participant: {
        id: participant.id,
        qualificationPnlUsd: pnlUsd,
        qualificationTrades: totalTrades,
      },
      message: 'You\'re registered for Season 1! 🏆',
    });
  } catch (error) {
    console.error('[cup/register] Error:', error);
    return NextResponse.json(
      { error: 'Internal error', message: 'Failed to register for Season 1' },
      { status: 500 }
    );
  }
}
