/**
 * TRENCHER CUP TOURNAMENT ENGINE
 * 
 * Core business logic for managing tournament seasons:
 * - Season creation and lifecycle
 * - Qualification (top 32 by PnL)
 * - Group seeding (serpentine)
 * - Match creation and live PnL tracking
 * - Round advancement engine
 */

import { prisma } from '@/lib/prisma';
import { getSolPrice } from '@/lib/sol-price';
import { sendTournamentNotification, type TournamentEvent } from '@/lib/cup-notifications';

// ──────────────────────────────────────────────────────────────
// SEASON MANAGEMENT
// ──────────────────────────────────────────────────────────────

export type CupStatus = 
  | 'draft'       // Season created, not started
  | 'qualifying'  // Qualification window open
  | 'groups'      // Group stage live
  | 'r16'         // Round of 16
  | 'qf'          // Quarter-finals
  | 'sf'          // Semi-finals
  | 'final'       // The Final
  | 'completed';  // Season ended, prizes distributed

export interface CreateSeasonInput {
  name: string;
  slug: string;
  qualificationStart: Date;
  qualificationEnd: Date;
  groupStart: Date;
  groupEnd: Date;
  r16Start: Date;
  r16End: Date;
  qfStart: Date;
  qfEnd: Date;
  sfStart: Date;
  sfEnd: Date;
  finalStart: Date;
  finalEnd: Date;
  prizePoolUsd?: number;
  prizePoolToken?: string;
}

export async function createSeason(input: CreateSeasonInput) {
  return prisma.cupSeason.create({
    data: {
      name: input.name,
      slug: input.slug,
      qualificationStart: input.qualificationStart,
      qualificationEnd: input.qualificationEnd,
      groupStart: input.groupStart,
      groupEnd: input.groupEnd,
      r16Start: input.r16Start,
      r16End: input.r16End,
      qfStart: input.qfStart,
      qfEnd: input.qfEnd,
      sfStart: input.sfStart,
      sfEnd: input.sfEnd,
      finalStart: input.finalStart,
      finalEnd: input.finalEnd,
      prizePoolUsd: input.prizePoolUsd ?? 0,
      prizePoolToken: input.prizePoolToken,
      status: 'draft',
    },
  });
}

export async function getSeason(slug: string) {
  return prisma.cupSeason.findUnique({
    where: { slug },
    include: {
      participants: { include: { user: true } },
      groups: true,
      matches: true,
      prizeDistributions: true,
    },
  });
}

export async function getCurrentSeason() {
  return prisma.cupSeason.findFirst({
    where: { status: { not: 'draft' } },
    orderBy: { createdAt: 'desc' },
    include: {
      participants: { include: { user: true } },
      groups: true,
      matches: true,
      prizeDistributions: true,
    },
  });
}

// ──────────────────────────────────────────────────────────────
// QUALIFICATION ENGINE
// ──────────────────────────────────────────────────────────────

/**
 * Get the top N traders by PnL within a time window.
 * This is used to determine who qualifies for the cup.
 */
export async function getQualifiers(
  startDate: Date,
  endDate: Date,
  limit: number = 32,
) {
  // Get all wallets with trades in the qualification window
  const wallets = await prisma.wallet.findMany({
    where: {
      trades: {
        some: {
          firstTradeAt: { gte: startDate },
          lastTradeAt: { lte: endDate },
        },
      },
    },
    include: {
      user: true,
      trades: {
        where: {
          firstTradeAt: { gte: startDate },
          lastTradeAt: { lte: endDate },
        },
      },
    },
  });

  // Aggregate PnL per user
  const userStats = new Map<string, {
    userId: string;
    username: string;
    displayName: string;
    pnlSol: number;
    trades: number;
    walletIds: string[];
  }>();

  for (const wallet of wallets) {
    const existing = userStats.get(wallet.userId);
    const pnlSol = wallet.trades.reduce((sum, t) => sum + t.pnlSol, 0);
    const tradeCount = wallet.trades.reduce((sum, t) => sum + t.tradeCount, 0);

    if (existing) {
      existing.pnlSol += pnlSol;
      existing.trades += tradeCount;
      existing.walletIds.push(wallet.id);
    } else {
      userStats.set(wallet.userId, {
        userId: wallet.userId,
        username: wallet.user.username,
        displayName: wallet.user.displayName,
        pnlSol,
        trades: tradeCount,
        walletIds: [wallet.id],
      });
    }
  }

  // Sort by PnL and take top N
  const solPrice = await getSolPrice();
  const sorted = Array.from(userStats.values())
    .sort((a, b) => b.pnlSol - a.pnlSol)
    .slice(0, limit)
    .map((u, i) => ({
      rank: i + 1,
      userId: u.userId,
      username: u.username,
      displayName: u.displayName,
      pnlSol: u.pnlSol,
      pnlUsd: u.pnlSol * solPrice,
      trades: u.trades,
    }));

  return sorted;
}

/**
 * Populate a season with the top 32 qualifiers.
 */
export async function populateSeason(seasonId: string, startDate: Date, endDate: Date) {
  const qualifiers = await getQualifiers(startDate, endDate, 32);

  if (qualifiers.length < 32) {
    throw new Error(
      `Not enough qualifiers: need 32, got ${qualifiers.length}. ` +
      `Tournament cannot start until 32 traders qualify.`
    );
  }

  // Create participant records
  const participants = await Promise.all(
    qualifiers.map((q) =>
      prisma.cupParticipant.create({
        data: {
          seasonId,
          userId: q.userId,
          qualificationPnlUsd: q.pnlUsd,
          qualificationPnlSol: q.pnlSol,
          qualificationTrades: q.trades,
          currentRound: 'qualified',
        },
      })
    )
  );

  // Update season participant count
  await prisma.cupSeason.update({
    where: { id: seasonId },
    data: { participantCount: participants.length },
  });

  return { participants, qualifiers };
}

// ──────────────────────────────────────────────────────────────
// GROUP STAGE ENGINE
// ──────────────────────────────────────────────────────────────

const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/**
 * Serpentine seeding into 8 groups of 4.
 * Seeds 1-8:   A B C D E F G H (forward)
 * Seeds 9-16:  H G F E D C B A (reverse)
 * Seeds 17-24: A B C D E F G H (forward)
 * Seeds 25-32: H G F E D C B A (reverse)
 */
export async function drawGroups(seasonId: string) {
  // Get all participants sorted by qualification PnL
  const participants = await prisma.cupParticipant.findMany({
    where: { seasonId },
    include: { user: true },
    orderBy: { qualificationPnlUsd: 'desc' },
  });

  if (participants.length !== 32) {
    throw new Error(`Need exactly 32 participants for group draw, got ${participants.length}`);
  }

  // Assign seeds
  const seeded = participants.map((p, i) => ({ ...p, seed: i + 1 }));

  // Serpentine assignment
  const groups: string[][] = Array.from({ length: 8 }, () => []);

  for (let i = 0; i < 32; i++) {
    const row = Math.floor(i / 8);
    const col = i % 8;
    const groupIdx = row % 2 === 0 ? col : 7 - col;
    groups[groupIdx].push(seeded[i].id);
  }

  // Create group records
  const groupRecords = await Promise.all(
    groups.map((participantIds, i) =>
      prisma.cupGroup.create({
        data: {
          seasonId,
          name: GROUP_NAMES[i],
          seed: i,
          participantIds,
        },
      })
    )
  );

  // Update participants with group and seed
  await Promise.all(
    seeded.map((p) => {
      const groupIdx = groups.findIndex((g) => g.includes(p.id));
      return prisma.cupParticipant.update({
        where: { id: p.id },
        data: {
          seed: p.seed,
          group: GROUP_NAMES[groupIdx],
          currentRound: 'group',
        },
      });
    })
  );

  // Create group stage matches (each group has 4 traders, each vs each)
  // For simplicity: group match is "whoever has highest PnL in window wins group"
  // We create 1 match per group that tracks all 4 participants
  const groupMatches = await Promise.all(
    groups.map((participantIds, i) =>
      prisma.cupMatch.create({
        data: {
          seasonId,
          round: 'group',
          matchNumber: i + 1,
          participant1Id: participantIds[0],
          participant2Id: participantIds[1],
          // Note: participants 3 and 4 are tracked via participantIds in CupGroup
          windowStart: new Date(), // Will be set by season config
          windowEnd: new Date(),
          status: 'scheduled',
        },
      })
    )
  );

  return { groups: groupRecords, participants: seeded, matches: groupMatches };
}

// ──────────────────────────────────────────────────────────────
// KNOCKOUT ENGINE
// ──────────────────────────────────────────────────────────────

/**
 * Create knockout round matches.
 * Takes top 2 from each group for R16, then advances winners.
 */
export async function createKnockoutRound(
  seasonId: string,
  round: 'r16' | 'qf' | 'sf' | 'final',
  windowStart: Date,
  windowEnd: Date,
) {
  if (round === 'r16') {
    return createR16(seasonId, windowStart, windowEnd);
  } else if (round === 'qf') {
    return createQF(seasonId, windowStart, windowEnd);
  } else if (round === 'sf') {
    return createSF(seasonId, windowStart, windowEnd);
  } else {
    return createFinal(seasonId, windowStart, windowEnd);
  }
}

async function createR16(seasonId: string, windowStart: Date, windowEnd: Date) {
  // Get top 2 from each group (based on group match PnL)
  const groups = await prisma.cupGroup.findMany({
    where: { seasonId },
    orderBy: { seed: 'asc' },
  });

  // For each group, determine top 2 based on their group match PnL
  // (This will be computed when group matches are resolved)
  const topTwoPerGroup: string[][] = [];

  for (const group of groups) {
    const participants = await prisma.cupParticipant.findMany({
      where: { id: { in: group.participantIds } },
      orderBy: { qualificationPnlUsd: 'desc' },
      take: 2,
    });
    topTwoPerGroup.push(participants.map((p) => p.id));
  }

  // R16 matchups:
  // 1stA vs 2ndB, 1stC vs 2ndD, 1st E vs 2nd F, 1st G vs 2nd H
  // 1stB vs 2ndA, 1stD vs 2nd C, 1st F vs 2nd E, 1st H vs 2nd G
  const matchups: [number, number][] = [
    [0, 1], [2, 3], [4, 5], [6, 7], // 1st of group 0 vs 2nd of group 1, etc.
    [1, 0], [3, 2], [5, 4], [7, 6], // Reverse for bracket balance
  ];

  const matches = await Promise.all(
    matchups.map(([firstIdx, secondIdx], i) =>
      prisma.cupMatch.create({
        data: {
          seasonId,
          round: 'r16',
          matchNumber: i + 1,
          participant1Id: topTwoPerGroup[firstIdx][0], // 1st of group
          participant2Id: topTwoPerGroup[secondIdx][1], // 2nd of other group
          windowStart,
          windowEnd,
          status: 'scheduled',
        },
      })
    )
  );

  // Update participants to R16 round
  const allR16Ids = matches.flatMap((m) => [m.participant1Id, m.participant2Id]).filter((id: string | null): id is string => id !== null);
  await prisma.cupParticipant.updateMany({
    where: { id: { in: allR16Ids } },
    data: { currentRound: 'r16' },
  });

  return matches;
}

async function createQF(seasonId: string, windowStart: Date, windowEnd: Date) {
  // Get R16 winners
  const r16Matches = await prisma.cupMatch.findMany({
    where: { seasonId, round: 'r16' },
    orderBy: { matchNumber: 'asc' },
  });

  const winners = r16Matches.map((m) => m.winnerId).filter((id: string | null): id is string => id !== null);

  if (winners.length !== 8) {
    throw new Error(`Need 8 R16 winners for QF, got ${winners.length}`);
  }

  // QF matchups: R16-1 winner vs R16-2 winner, R16-3 vs R16-4, etc.
  const matches = await Promise.all(
    Array.from({ length: 4 }, (_, i) =>
      prisma.cupMatch.create({
        data: {
          seasonId,
          round: 'qf',
          matchNumber: i + 1,
          participant1Id: winners[i * 2],
          participant2Id: winners[i * 2 + 1],
          windowStart,
          windowEnd,
          status: 'scheduled',
        },
      })
    )
  );

  // Update participants
  const allQFIds = matches.flatMap((m) => [m.participant1Id, m.participant2Id]).filter((id: string | null): id is string => id !== null);
  await prisma.cupParticipant.updateMany({
    where: { id: { in: allQFIds } },
    data: { currentRound: 'qf' },
  });

  return matches;
}

async function createSF(seasonId: string, windowStart: Date, windowEnd: Date) {
  const qfMatches = await prisma.cupMatch.findMany({
    where: { seasonId, round: 'qf' },
    orderBy: { matchNumber: 'asc' },
  });

  const winners = qfMatches.map((m) => m.winnerId).filter((id: string | null): id is string => id !== null);

  if (winners.length !== 4) {
    throw new Error(`Need 4 QF winners for SF, got ${winners.length}`);
  }

  const matches = await Promise.all(
    Array.from({ length: 2 }, (_, i) =>
      prisma.cupMatch.create({
        data: {
          seasonId,
          round: 'sf',
          matchNumber: i + 1,
          participant1Id: winners[i * 2],
          participant2Id: winners[i * 2 + 1],
          windowStart,
          windowEnd,
          status: 'scheduled',
        },
      })
    )
  );

  const allSFIds = matches.flatMap((m) => [m.participant1Id, m.participant2Id]).filter((id: string | null): id is string => id !== null);
  await prisma.cupParticipant.updateMany({
    where: { id: { in: allSFIds } },
    data: { currentRound: 'sf' },
  });

  return matches;
}

async function createFinal(seasonId: string, windowStart: Date, windowEnd: Date) {
  const sfMatches = await prisma.cupMatch.findMany({
    where: { seasonId, round: 'sf' },
    orderBy: { matchNumber: 'asc' },
  });

  const winners = sfMatches.map((m) => m.winnerId).filter((id: string | null): id is string => id !== null);

  if (winners.length !== 2) {
    throw new Error(`Need 2 SF winners for Final, got ${winners.length}`);
  }

  const match = await prisma.cupMatch.create({
    data: {
      seasonId,
      round: 'final',
      matchNumber: 1,
      participant1Id: winners[0],
      participant2Id: winners[1],
      windowStart,
      windowEnd,
      status: 'scheduled',
    },
  });

  await prisma.cupParticipant.updateMany({
    where: { id: { in: winners } },
    data: { currentRound: 'final' },
  });

  return match;
}

// ──────────────────────────────────────────────────────────────
// LIVE PnL TRACKING
// ──────────────────────────────────────────────────────────────

/**
 * Get a participant's realized PnL within a specific time window.
 * This is the core function for determining match winners.
 */
export async function getParticipantPnlInWindow(
  participantId: string,
  windowStart: Date,
  windowEnd: Date,
) {
  const participant = await prisma.cupParticipant.findUnique({
    where: { id: participantId },
    include: { user: { include: { wallets: true } } },
  });

  if (!participant) return null;

  const walletIds = participant.user.wallets.map((w) => w.id);

  if (walletIds.length === 0) return { pnlUsd: 0, pnlSol: 0, trades: 0 };

  // Get trades within the window
  const trades = await prisma.walletTrade.findMany({
    where: {
      walletId: { in: walletIds },
      firstTradeAt: { lte: windowEnd },
      lastTradeAt: { gte: windowStart },
    },
  });

  const pnlSol = trades.reduce((sum, t) => sum + t.pnlSol, 0);
  const tradeCount = trades.reduce((sum, t) => sum + t.tradeCount, 0);

  const solPrice = await getSolPrice();

  return {
    pnlSol,
    pnlUsd: pnlSol * solPrice,
    trades: tradeCount,
  };
}

/**
 * Update all live matches with current PnL data.
 * This should be called periodically during active rounds.
 */
export async function refreshLiveMatches(seasonId: string) {
  const liveMatches = await prisma.cupMatch.findMany({
    where: {
      seasonId,
      status: { in: ['scheduled', 'live'] },
      windowStart: { lte: new Date() },
      windowEnd: { gte: new Date() },
    },
  });

  const results = await Promise.all(
    liveMatches.map(async (match) => {
      const p1Pnl = match.participant1Id
        ? await getParticipantPnlInWindow(match.participant1Id, match.windowStart, match.windowEnd)
        : null;
      const p2Pnl = match.participant2Id
        ? await getParticipantPnlInWindow(match.participant2Id, match.windowStart, match.windowEnd)
        : null;

      const updates: Record<string, unknown> = {
        participant1PnlUsd: p1Pnl?.pnlUsd ?? 0,
        participant2PnlUsd: p2Pnl?.pnlUsd ?? 0,
        participant1Trades: p1Pnl?.trades ?? 0,
        participant2Trades: p2Pnl?.trades ?? 0,
      };

      // If window has closed, determine winner
      const now = new Date();
      if (now >= match.windowEnd && p1Pnl && p2Pnl) {
        const winnerId = resolveMatch(
          { pnlUsd: p1Pnl.pnlUsd, trades: p1Pnl.trades },
          { pnlUsd: p2Pnl.pnlUsd, trades: p2Pnl.trades },
          match.participant1Id!,
          match.participant2Id!,
        );

        updates.winnerId = winnerId;
        updates.status = 'completed';
        updates.completedAt = now;
      } else if (now >= match.windowStart && now < match.windowEnd) {
        updates.status = 'live';
      }

      return prisma.cupMatch.update({
        where: { id: match.id },
        data: updates,
      });
    })
  );

  return results;
}

function resolveMatch(
  p1: { pnlUsd: number; trades: number },
  p2: { pnlUsd: number; trades: number },
  p1Id: string,
  p2Id: string,
): string {
  // Primary: PnL
  if (p1.pnlUsd !== p2.pnlUsd) return p1.pnlUsd > p2.pnlUsd ? p1Id : p2Id;
  // Tiebreaker: trade count
  if (p1.trades !== p2.trades) return p1.trades > p2.trades ? p1Id : p2Id;
  // Default: participant 1 (should be higher seed)
  return p1Id;
}

// ──────────────────────────────────────────────────────────────
// ROUND ADVANCEMENT ENGINE
// ──────────────────────────────────────────────────────────────

/**
 * Advance to the next round.
 * This resolves completed matches, eliminates losers, and creates next round matches.
 */
export async function advanceRound(seasonId: string, nextRound: CupStatus) {
  const season = await prisma.cupSeason.findUnique({
    where: { id: seasonId },
  });

  if (!season) throw new Error('Season not found');

  // Refresh all live matches first
  await refreshLiveMatches(seasonId);

  // Get all completed matches for current round
  const currentRoundMap: Record<string, string> = {
    draft: '',
    qualifying: '',
    groups: 'group',
    r16: 'r16',
    qf: 'qf',
    sf: 'sf',
    final: 'final',
    completed: 'final',
  };

  const currentRoundKey = currentRoundMap[season.status];

  // Eliminate losers of completed matches
  const completedMatches = await prisma.cupMatch.findMany({
    where: { seasonId, round: currentRoundKey, status: 'completed' },
  });

  for (const match of completedMatches) {
    const loserId = match.winnerId === match.participant1Id
      ? match.participant2Id
      : match.participant1Id;

    if (loserId) {
      await prisma.cupParticipant.update({
        where: { id: loserId },
        data: {
          currentRound: 'eliminated',
          eliminatedAt: match.completedAt,
        },
      });
    }
  }

  // Update season status
  const updatedSeason = await prisma.cupSeason.update({
    where: { id: seasonId },
    data: { status: nextRound },
  });

  // Send notification for round transition
  const notificationEvent: Record<string, TournamentEvent> = {
    groups: 'groups_start',
    r16: 'r16_start',
    qf: 'qf_start',
    sf: 'sf_start',
    final: 'final_start',
    completed: 'champion_crowned',
  };

  if (notificationEvent[nextRound]) {
    // Fire and forget — don't block on notification
    sendTournamentNotification({
      event: notificationEvent[nextRound],
      seasonName: season.name,
    }).catch(() => {});
  }

  // Create next round matches
  let nextMatches: unknown = null;
  if (nextRound === 'r16') {
    const windowStart = season.r16Start;
    const windowEnd = season.r16End;
    nextMatches = await createR16(seasonId, windowStart, windowEnd);
  } else if (nextRound === 'qf') {
    const windowStart = season.qfStart;
    const windowEnd = season.qfEnd;
    nextMatches = await createQF(seasonId, windowStart, windowEnd);
  } else if (nextRound === 'sf') {
    const windowStart = season.sfStart;
    const windowEnd = season.sfEnd;
    nextMatches = await createSF(seasonId, windowStart, windowEnd);
  } else if (nextRound === 'final') {
    const windowStart = season.finalStart;
    const windowEnd = season.finalEnd;
    nextMatches = await createFinal(seasonId, windowStart, windowEnd);
  }

  return { season: updatedSeason, nextMatches };
}

// ──────────────────────────────────────────────────────────────
// PRIZE DISTRIBUTION
// ──────────────────────────────────────────────────────────────

export interface PrizeConfig {
  rank: number;
  title: string;
  percentage: number;
}

const DEFAULT_PRIZE_CONFIG: PrizeConfig[] = [
  { rank: 1, title: 'Champion', percentage: 0.40 },
  { rank: 2, title: 'Runner-up', percentage: 0.25 },
  { rank: 3, title: 'Semi-finalist', percentage: 0.10 },
  { rank: 4, title: 'Semi-finalist', percentage: 0.10 },
  { rank: 5, title: 'Quarter-finalist', percentage: 0.0375 },
  { rank: 6, title: 'Quarter-finalist', percentage: 0.0375 },
  { rank: 7, title: 'Quarter-finalist', percentage: 0.0375 },
  { rank: 8, title: 'Quarter-finalist', percentage: 0.0375 },
];

export async function setupPrizeDistribution(
  seasonId: string,
  configs: PrizeConfig[] = DEFAULT_PRIZE_CONFIG,
) {
  const season = await prisma.cupSeason.findUnique({
    where: { id: seasonId },
  });

  if (!season) throw new Error('Season not found');

  const distributions = await Promise.all(
    configs.map((c) =>
      prisma.cupPrizeDistribution.create({
        data: {
          seasonId,
          rank: c.rank,
          title: c.title,
          percentage: c.percentage,
          prizeUsd: season.prizePoolUsd * c.percentage,
          paid: false,
        },
      })
    )
  );

  return distributions;
}
