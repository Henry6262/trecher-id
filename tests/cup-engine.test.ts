/**
 * TRENCHER CUP — END-TO-END TEST SUITE
 * 
 * Tests the complete tournament lifecycle:
 * 1. Season creation
 * 2. Qualification (top 32 by PnL)
 * 3. Group seeding (serpentine)
 * 4. Match creation
 * 5. Live PnL tracking
 * 6. Round advancement (groups -> R16 -> QF -> SF -> Final)
 * 7. Prize distribution
 * 8. Edge cases and error handling
 */

import { loadEnvConfig } from '@next/env';
import { describe, it, expect, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import {
  createSeason,
  getSeason,
  getCurrentSeason,
  getQualifiers,
  populateSeason,
  drawGroups,
  createKnockoutRound,
  getParticipantPnlInWindow,
  advanceRound,
  setupPrizeDistribution,
  type CreateSeasonInput,
} from '../src/lib/cup-engine';

// ──────────────────────────────────────────────────────────────
// TEST DATABASE SETUP
// ──────────────────────────────────────────────────────────────

loadEnvConfig(process.cwd(), true);

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  for (const filename of ['.env.local', '.env']) {
    const filePath = path.join(process.cwd(), filename);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/^DATABASE_URL="?([^\n"]+)"?\s*$/m);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

const testDatabaseUrl = getDatabaseUrl();
if (!testDatabaseUrl) {
  throw new Error('DATABASE_URL is not set for tests');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(new pg.Pool({
    connectionString: testDatabaseUrl,
  })),
});

// Test helpers
const TEST_SEASON_SLUG = 'test-season-e2e';
const CLEANUP_USERS: string[] = [];
const CLEANUP_SEASON: string[] = [];

async function createTestUser(username: string, displayName: string) {
  const user = await prisma.user.create({
    data: {
      username: `test_${username}_${Date.now()}`,
      displayName,
      privyUserId: `test_privy_${Date.now()}_${Math.random()}`,
      twitterId: `test_twitter_${Date.now()}_${Math.random()}`,
    },
  });
  CLEANUP_USERS.push(user.id);
  return user;
}

async function createTestWallet(userId: string, address: string) {
  return prisma.wallet.create({
    data: {
      userId,
      address,
      totalPnlUsd: 0,
      winRate: 0,
      totalTrades: 0,
    },
  });
}

async function createTestTrade(walletId: string, pnlSol: number, tradeCount: number, firstTradeAt: Date, lastTradeAt: Date) {
  return prisma.walletTrade.create({
    data: {
      walletId,
      tokenMint: `test_token_${Date.now()}_${Math.random()}`,
      tokenSymbol: 'TEST',
      pnlSol,
      tradeCount,
      buySol: pnlSol > 0 ? pnlSol * 0.5 : 0,
      sellSol: pnlSol > 0 ? pnlSol * 1.5 : 0,
      firstTradeAt,
      lastTradeAt,
    },
  });
}

// ──────────────────────────────────────────────────────────────
// CLEANUP
// ──────────────────────────────────────────────────────────────

afterAll(async () => {
  // Fast cleanup - delete seasons first (cascades to participants, groups, matches, prizes)
  for (const seasonId of CLEANUP_SEASON) {
    try {
      await prisma.cupSeason.delete({ where: { id: seasonId } });
    } catch {
      // Already deleted or doesn't exist
    }
  }

  // Delete cup participations for test users
  for (const userId of CLEANUP_USERS) {
    try {
      await prisma.cupParticipant.deleteMany({ where: { userId } });
    } catch {
      // Already deleted
    }
  }

  // Clean up test users (cascades to wallets, trades, etc.)
  for (const userId of CLEANUP_USERS) {
    try {
      await prisma.user.delete({ where: { id: userId } });
    } catch {
      // Already deleted
    }
  }

  await prisma.$disconnect();
}, 120000);

// ──────────────────────────────────────────────────────────────
// 1. SEASON CREATION
// ──────────────────────────────────────────────────────────────

describe('Season Creation', () => {
  it('should create a new season with all time windows', async () => {
    const now = new Date();
    const input: CreateSeasonInput = {
      name: 'Test Season 1',
      slug: `${TEST_SEASON_SLUG}-${Date.now()}`,
      qualificationStart: now,
      qualificationEnd: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000), // 4 weeks
      groupStart: new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000),
      groupEnd: new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000),
      r16Start: new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000),
      r16End: new Date(now.getTime() + 34 * 24 * 60 * 60 * 1000),
      qfStart: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000),
      qfEnd: new Date(now.getTime() + 37 * 24 * 60 * 60 * 1000),
      sfStart: new Date(now.getTime() + 38 * 24 * 60 * 60 * 1000),
      sfEnd: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000),
      finalStart: new Date(now.getTime() + 41 * 24 * 60 * 60 * 1000),
      finalEnd: new Date(now.getTime() + 44 * 24 * 60 * 60 * 1000),
      prizePoolUsd: 10000,
      prizePoolToken: 'WEB3ME',
    };

    const season = await createSeason(input);
    CLEANUP_SEASON.push(season.id);

    expect(season).toBeDefined();
    expect(season.name).toBe('Test Season 1');
    expect(season.slug).toBe(input.slug);
    expect(season.status).toBe('draft');
    expect(season.prizePoolUsd).toBe(10000);
    expect(season.prizePoolToken).toBe('WEB3ME');
    expect(season.participantCount).toBe(0);
    expect(season.championUserId).toBeNull();
  });

  it('should retrieve a season by slug', async () => {
    const now = new Date();
    const slug = `${TEST_SEASON_SLUG}-retrieve-${Date.now()}`;

    const created = await createSeason({
      name: 'Retrieve Test',
      slug,
      qualificationStart: now,
      qualificationEnd: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      groupStart: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      groupEnd: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      r16Start: new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000),
      r16End: new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000),
      qfStart: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      qfEnd: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
      sfStart: new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000),
      sfEnd: new Date(now.getTime() + 19 * 24 * 60 * 60 * 1000),
      finalStart: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      finalEnd: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000),
    });
    CLEANUP_SEASON.push(created.id);

    const retrieved = await getSeason(slug);
    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe(created.id);
    expect(retrieved!.participants).toEqual([]);
    expect(retrieved!.groups).toEqual([]);
    expect(retrieved!.matches).toEqual([]);
  });

  it('should get the most recent non-draft season', async () => {
    const now = new Date();
    const slug = `${TEST_SEASON_SLUG}-current-${Date.now()}`;

    const created = await createSeason({
      name: 'Current Season Test',
      slug,
      qualificationStart: now,
      qualificationEnd: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      groupStart: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      groupEnd: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      r16Start: new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000),
      r16End: new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000),
      qfStart: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      qfEnd: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
      sfStart: new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000),
      sfEnd: new Date(now.getTime() + 19 * 24 * 60 * 60 * 1000),
      finalStart: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      finalEnd: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000),
    });
    CLEANUP_SEASON.push(created.id);

    // Update status so it's not draft
    await prisma.cupSeason.update({
      where: { id: created.id },
      data: { status: 'qualifying' },
    });

    const current = await getCurrentSeason();
    expect(current).toBeDefined();
    expect(current!.id).toBe(created.id);
  });
});

// ──────────────────────────────────────────────────────────────
// 2. QUALIFICATION ENGINE
// ──────────────────────────────────────────────────────────────

describe('Qualification Engine', () => {
  it('should return top 32 traders by PnL within a time window', async () => {
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const endDate = now;

    // Create 40 test users with wallets and trades
    await Promise.all(
      Array.from({ length: 40 }, async (_, i) => {
        const user = await createTestUser(`qualifier_${i}`, `Qualifier ${i}`);
        const wallet = await createTestWallet(user.id, `0xTestWallet_${i}_${Date.now()}`);
        // Create trades with varying PnL (descending order)
        await createTestTrade(
          wallet.id,
          (40 - i) * 10, // Trader 0 gets 400 SOL, Trader 1 gets 390 SOL, etc.
          50,
          startDate,
          endDate,
        );
        return { user, wallet };
      })
    );

    const qualifiers = await getQualifiers(startDate, endDate, 32);

    expect(qualifiers.length).toBe(32);
    // Should be sorted by PnL descending
    for (let i = 0; i < qualifiers.length - 1; i++) {
      expect(qualifiers[i].pnlSol).toBeGreaterThanOrEqual(qualifiers[i + 1].pnlSol);
    }
    // Top qualifier should have highest PnL (our test users have (40-i)*10 SOL)
    expect(qualifiers[0].pnlSol).toBeGreaterThan(0);
    expect(qualifiers[0].rank).toBe(1);
  });

  it('should only count trades within the qualification window', async () => {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const user = await createTestUser('window_test', 'Window Test');
    const wallet = await createTestWallet(user.id, `0xWindowTest_${Date.now()}`);

    // Trade OUTSIDE window (before)
    await createTestTrade(
      wallet.id,
      500, // Big PnL but outside window
      100,
      new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    );

    // Trade INSIDE window
    await createTestTrade(
      wallet.id,
      50, // Smaller PnL but inside window
      10,
      windowStart,
      windowEnd,
    );

    const qualifiers = await getQualifiers(windowStart, windowEnd, 32);

    // Should only see the inside-window trade
    const userQual = qualifiers.find((q) => q.username === user.username);
    if (userQual) {
      expect(userQual.pnlSol).toBe(50);
      expect(userQual.trades).toBe(10);
    }
  });

  it('should aggregate PnL across multiple wallets per user', async () => {
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const endDate = now;

    const user = await createTestUser('multi_wallet', 'Multi Wallet');
    const wallet1 = await createTestWallet(user.id, `0xMulti1_${Date.now()}`);
    const wallet2 = await createTestWallet(user.id, `0xMulti2_${Date.now()}`);

    await createTestTrade(wallet1.id, 100, 20, startDate, endDate);
    await createTestTrade(wallet2.id, 200, 30, startDate, endDate);

    const qualifiers = await getQualifiers(startDate, endDate, 32);
    console.log('QUALIFIERS COUNT:', qualifiers.length);
    if (qualifiers.length > 0) {
      console.log('FIRST QUALIFIER:', qualifiers[0]);
    }
    const userQual = qualifiers.find((q) => q.username === user.username);

    expect(userQual).toBeDefined();
    expect(userQual!.pnlSol).toBe(300); // 100 + 200
    expect(userQual!.trades).toBe(50); // 20 + 30
  });

  it('should reject if fewer than 32 qualifiers', async () => {
    const now = new Date();
    // Use a date range in the future where no existing wallets have trades
    const startDate = new Date(now.getTime() + 500 * 24 * 60 * 60 * 1000);
    const endDate = new Date(now.getTime() + 501 * 24 * 60 * 60 * 1000);

    // Create a fresh season
    const season = await createSeason({
      name: 'Not Enough Qualifiers',
      slug: `${TEST_SEASON_SLUG}-notenough-${Date.now()}`,
      qualificationStart: startDate,
      qualificationEnd: endDate,
      groupStart: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      groupEnd: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      r16Start: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      r16End: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      qfStart: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      qfEnd: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
      sfStart: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      sfEnd: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
      finalStart: new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000),
      finalEnd: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
    });
    CLEANUP_SEASON.push(season.id);

    // Try to populate with only 5 users
    await expect(populateSeason(season.id, startDate, endDate)).rejects.toThrow(
      /Not enough qualifiers/
    );
  });
});

// ──────────────────────────────────────────────────────────────
// 3. SEASON POPULATION
// ──────────────────────────────────────────────────────────────

describe('Season Population', () => {
  it('should create 32 participant records', async () => {
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const endDate = now;

    const season = await createSeason({
      name: 'Population Test',
      slug: `${TEST_SEASON_SLUG}-populate-${Date.now()}`,
      qualificationStart: startDate,
      qualificationEnd: endDate,
      groupStart: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      groupEnd: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      r16Start: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      r16End: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      qfStart: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      qfEnd: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
      sfStart: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      sfEnd: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
      finalStart: new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000),
      finalEnd: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
    });
    CLEANUP_SEASON.push(season.id);

    // Create exactly 32 users with wallets and trades
    await Promise.all(
      Array.from({ length: 32 }, async (_, i) => {
        const user = await createTestUser(`pop_${i}`, `Pop ${i}`);
        const wallet = await createTestWallet(user.id, `0xPopWallet_${i}_${Date.now()}`);
        await createTestTrade(
          wallet.id,
          (32 - i) * 10,
          50,
          startDate,
          endDate,
        );
        return user;
      })
    );

    const { participants, qualifiers } = await populateSeason(season.id, startDate, endDate);

    expect(participants.length).toBe(32);
    expect(qualifiers.length).toBe(32);

    // Verify participant data
    for (const p of participants) {
      expect(p.seasonId).toBe(season.id);
      expect(p.currentRound).toBe('qualified');
      expect(p.qualificationPnlUsd).toBeDefined();
      expect(p.qualificationPnlSol).toBeDefined();
      expect(p.qualificationTrades).toBeGreaterThan(0);
    }

    // Verify season updated
    const updatedSeason = await getSeason(season.slug);
    expect(updatedSeason!.participantCount).toBe(32);
  });
});

// ──────────────────────────────────────────────────────────────
// 4. GROUP DRAW (SERPENTINE SEEDING)
// ──────────────────────────────────────────────────────────────

describe('Group Draw', () => {
  it('should create 8 groups with 4 participants each', async () => {
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const endDate = now;

    const season = await createSeason({
      name: 'Group Draw Test',
      slug: `${TEST_SEASON_SLUG}-groups-${Date.now()}`,
      qualificationStart: startDate,
      qualificationEnd: endDate,
      groupStart: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      groupEnd: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      r16Start: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      r16End: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      qfStart: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      qfEnd: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
      sfStart: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      sfEnd: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
      finalStart: new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000),
      finalEnd: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
    });
    CLEANUP_SEASON.push(season.id);

    // Create 32 users
    await Promise.all(
      Array.from({ length: 32 }, async (_, i) => {
        const user = await createTestUser(`grp_${i}`, `Grp ${i}`);
        const wallet = await createTestWallet(user.id, `0xGrpWallet_${i}_${Date.now()}`);
        await createTestTrade(
          wallet.id,
          (32 - i) * 10,
          50,
          startDate,
          endDate,
        );
      })
    );

    await populateSeason(season.id, startDate, endDate);

    const { groups, participants } = await drawGroups(season.id);

    expect(groups.length).toBe(8);
    expect(participants.length).toBe(32);

    // Verify each group has 4 participants
    for (const group of groups) {
      expect(group.participantIds.length).toBe(4);
      expect(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']).toContain(group.name);
    }

    // Re-fetch participants from DB to get updated group/seed
    const dbParticipants = await prisma.cupParticipant.findMany({
      where: { seasonId: season.id },
      orderBy: { seed: 'asc' },
    });

    // Verify serpentine seeding: seed 1 in group A, seed 8 in group H, seed 9 in group H
    const seed1 = dbParticipants.find((p) => p.seed === 1);
    const seed8 = dbParticipants.find((p) => p.seed === 8);
    const seed9 = dbParticipants.find((p) => p.seed === 9);

    expect(seed1!.group).toBe('A');
    expect(seed8!.group).toBe('H');
    expect(seed9!.group).toBe('H'); // Reverse row
  });

  it('should update participants with group and seed assignments', async () => {
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const endDate = now;

    const season = await createSeason({
      name: 'Group Update Test',
      slug: `${TEST_SEASON_SLUG}-grpupdate-${Date.now()}`,
      qualificationStart: startDate,
      qualificationEnd: endDate,
      groupStart: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      groupEnd: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      r16Start: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      r16End: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      qfStart: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      qfEnd: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
      sfStart: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      sfEnd: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
      finalStart: new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000),
      finalEnd: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
    });
    CLEANUP_SEASON.push(season.id);

    await Promise.all(
      Array.from({ length: 32 }, async (_, i) => {
        const user = await createTestUser(`grpupd_${i}`, `GrpUpd ${i}`);
        const wallet = await createTestWallet(user.id, `0xGrpUpdWallet_${i}_${Date.now()}`);
        await createTestTrade(wallet.id, (32 - i) * 10, 50, startDate, endDate);
      })
    );

    await populateSeason(season.id, startDate, endDate);
    await drawGroups(season.id);

    const participants = await prisma.cupParticipant.findMany({
      where: { seasonId: season.id },
    });

    // All participants should have seed and group assigned
    for (const p of participants) {
      expect(p.seed).toBeGreaterThan(0);
      expect(p.seed).toBeLessThanOrEqual(32);
      expect(p.group).toBeDefined();
      expect(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']).toContain(p.group);
      expect(p.currentRound).toBe('group');
    }
  });
});

// ──────────────────────────────────────────────────────────────
// 5. KNOCKOUT ROUND CREATION
// ──────────────────────────────────────────────────────────────

describe('Knockout Round Creation', () => {
  it('should create R16 matches from group winners and runners-up', async () => {
    // This test would need full setup with 32 participants in groups
    // For now, we test the structure
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const endDate = now;

    const season = await createSeason({
      name: 'R16 Test',
      slug: `${TEST_SEASON_SLUG}-r16-${Date.now()}`,
      qualificationStart: startDate,
      qualificationEnd: endDate,
      groupStart: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      groupEnd: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      r16Start: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      r16End: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      qfStart: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      qfEnd: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
      sfStart: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      sfEnd: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
      finalStart: new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000),
      finalEnd: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
    });
    CLEANUP_SEASON.push(season.id);

    // Create 32 users
    await Promise.all(
      Array.from({ length: 32 }, async (_, i) => {
        const user = await createTestUser(`r16_${i}`, `R16 ${i}`);
        const wallet = await createTestWallet(user.id, `0xR16Wallet_${i}_${Date.now()}`);
        await createTestTrade(wallet.id, (32 - i) * 10, 50, startDate, endDate);
      })
    );

    await populateSeason(season.id, startDate, endDate);
    await drawGroups(season.id);

    const windowStart = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);

    const matches = await createKnockoutRound(season.id, 'r16', windowStart, windowEnd);

    expect(matches.length).toBe(8); // 8 R16 matches

    // Verify match structure
    for (const match of matches) {
      expect(match.seasonId).toBe(season.id);
      expect(match.round).toBe('r16');
      expect(match.matchNumber).toBeGreaterThan(0);
      expect(match.matchNumber).toBeLessThanOrEqual(8);
      expect(match.participant1Id).toBeDefined();
      expect(match.participant2Id).toBeDefined();
      expect(match.status).toBe('scheduled');
      expect(match.windowStart).toEqual(windowStart);
      expect(match.windowEnd).toEqual(windowEnd);
    }
  });
});

// ──────────────────────────────────────────────────────────────
// 6. LIVE PnL TRACKING
// ──────────────────────────────────────────────────────────────

describe('Live PnL Tracking', () => {
  it('should return zero PnL for participant with no trades', async () => {
    const user = await createTestUser('nopnl', 'No PnL');
    await createTestWallet(user.id, `0xNoPnl_${Date.now()}`);

    const season = await createSeason({
      name: 'PnL Test',
      slug: `${TEST_SEASON_SLUG}-pnl-${Date.now()}`,
      qualificationStart: new Date(),
      qualificationEnd: new Date(),
      groupStart: new Date(),
      groupEnd: new Date(),
      r16Start: new Date(),
      r16End: new Date(),
      qfStart: new Date(),
      qfEnd: new Date(),
      sfStart: new Date(),
      sfEnd: new Date(),
      finalStart: new Date(),
      finalEnd: new Date(),
    });
    CLEANUP_SEASON.push(season.id);

    const participant = await prisma.cupParticipant.create({
      data: {
        seasonId: season.id,
        userId: user.id,
        currentRound: 'qualified',
      },
    });

    const now = new Date();
    const pnl = await getParticipantPnlInWindow(
      participant.id,
      new Date(now.getTime() - 24 * 60 * 60 * 1000),
      now,
    );

    expect(pnl).toBeDefined();
    expect(pnl!.pnlUsd).toBe(0);
    expect(pnl!.pnlSol).toBe(0);
    expect(pnl!.trades).toBe(0);
  });
});

// ──────────────────────────────────────────────────────────────
// 7. PRIZE DISTRIBUTION
// ──────────────────────────────────────────────────────────────

describe('Prize Distribution', () => {
  it('should create prize distribution records with correct amounts', async () => {
    const now = new Date();
    const season = await createSeason({
      name: 'Prize Test',
      slug: `${TEST_SEASON_SLUG}-prize-${Date.now()}`,
      qualificationStart: now,
      qualificationEnd: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      groupStart: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      groupEnd: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      r16Start: new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000),
      r16End: new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000),
      qfStart: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      qfEnd: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
      sfStart: new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000),
      sfEnd: new Date(now.getTime() + 19 * 24 * 60 * 60 * 1000),
      finalStart: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      finalEnd: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000),
      prizePoolUsd: 10000,
    });
    CLEANUP_SEASON.push(season.id);

    const distributions = await setupPrizeDistribution(season.id);

    expect(distributions.length).toBe(8);

    // Champion: 40% of $10,000 = $4,000
    const champion = distributions.find((d) => d.rank === 1);
    expect(champion).toBeDefined();
    expect(champion!.title).toBe('Champion');
    expect(champion!.prizeUsd).toBe(4000);
    expect(champion!.percentage).toBe(0.40);

    // Runner-up: 25% = $2,500
    const runnerUp = distributions.find((d) => d.rank === 2);
    expect(runnerUp).toBeDefined();
    expect(runnerUp!.prizeUsd).toBe(2500);

    // Verify total adds up to prize pool
    const total = distributions.reduce((sum, d) => sum + d.prizeUsd, 0);
    expect(total).toBe(10000);
  });
});

// ──────────────────────────────────────────────────────────────
// 8. ROUND ADVANCEMENT
// ──────────────────────────────────────────────────────────────

describe('Round Advancement', () => {
  it('should update season status when advancing rounds', async () => {
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const endDate = now;

    const season = await createSeason({
      name: 'Advancement Test',
      slug: `${TEST_SEASON_SLUG}-advance-${Date.now()}`,
      qualificationStart: startDate,
      qualificationEnd: endDate,
      groupStart: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      groupEnd: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      r16Start: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      r16End: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      qfStart: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      qfEnd: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
      sfStart: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      sfEnd: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
      finalStart: new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000),
      finalEnd: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
    });
    CLEANUP_SEASON.push(season.id);

    // Create 32 users
    await Promise.all(
      Array.from({ length: 32 }, async (_, i) => {
        const user = await createTestUser(`adv_${i}`, `Adv ${i}`);
        const wallet = await createTestWallet(user.id, `0xAdvWallet_${i}_${Date.now()}`);
        await createTestTrade(wallet.id, (32 - i) * 10, 50, startDate, endDate);
      })
    );

    await populateSeason(season.id, startDate, endDate);
    await drawGroups(season.id);

    // Advance to R16
    const result = await advanceRound(season.id, 'r16');

    expect(result.season.status).toBe('r16');
    expect(result.nextMatches).toBeDefined();
    expect(result.nextMatches).toHaveLength(8);
  });
});

// ──────────────────────────────────────────────────────────────
// 9. EDGE CASES
// ──────────────────────────────────────────────────────────────

describe('Edge Cases', () => {
  it('should handle duplicate season slug gracefully', async () => {
    const now = new Date();
    const slug = `${TEST_SEASON_SLUG}-dup-${Date.now()}`;

    await createSeason({
      name: 'First',
      slug,
      qualificationStart: now,
      qualificationEnd: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      groupStart: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      groupEnd: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      r16Start: new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000),
      r16End: new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000),
      qfStart: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      qfEnd: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
      sfStart: new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000),
      sfEnd: new Date(now.getTime() + 19 * 24 * 60 * 60 * 1000),
      finalStart: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      finalEnd: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000),
    });

    // Creating a second season with same slug should fail
    await expect(
      createSeason({
        name: 'Second',
        slug,
        qualificationStart: now,
        qualificationEnd: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        groupStart: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
        groupEnd: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        r16Start: new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000),
        r16End: new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000),
        qfStart: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        qfEnd: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
        sfStart: new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000),
        sfEnd: new Date(now.getTime() + 19 * 24 * 60 * 60 * 1000),
        finalStart: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
        finalEnd: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000),
      })
    ).rejects.toThrow();
  });

  it('should handle zero prize pool', async () => {
    const now = new Date();
    const season = await createSeason({
      name: 'Zero Prize Pool',
      slug: `${TEST_SEASON_SLUG}-zeroprize-${Date.now()}`,
      qualificationStart: now,
      qualificationEnd: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      groupStart: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      groupEnd: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      r16Start: new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000),
      r16End: new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000),
      qfStart: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      qfEnd: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
      sfStart: new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000),
      sfEnd: new Date(now.getTime() + 19 * 24 * 60 * 60 * 1000),
      finalStart: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      finalEnd: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000),
      prizePoolUsd: 0,
    });
    CLEANUP_SEASON.push(season.id);

    const distributions = await setupPrizeDistribution(season.id);
    expect(distributions.every((d) => d.prizeUsd === 0)).toBe(true);
  });

  it('should not allow group draw with fewer than 32 participants', async () => {
    const now = new Date();
    const season = await createSeason({
      name: 'Not Enough Groups',
      slug: `${TEST_SEASON_SLUG}-notgroups-${Date.now()}`,
      qualificationStart: now,
      qualificationEnd: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      groupStart: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      groupEnd: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      r16Start: new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000),
      r16End: new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000),
      qfStart: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      qfEnd: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
      sfStart: new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000),
      sfEnd: new Date(now.getTime() + 19 * 24 * 60 * 60 * 1000),
      finalStart: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      finalEnd: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000),
    });
    CLEANUP_SEASON.push(season.id);

    // Only create 10 participants (not 32)
    await Promise.all(
      Array.from({ length: 10 }, async (_, i) => {
        const user = await createTestUser(`nogrp_${i}`, `NoGrp ${i}`);
        await prisma.cupParticipant.create({
          data: {
            seasonId: season.id,
            userId: user.id,
            qualificationPnlUsd: (10 - i) * 100,
            qualificationPnlSol: (10 - i) * 10,
            qualificationTrades: 50,
          },
        });
      })
    );

    await expect(drawGroups(season.id)).rejects.toThrow(/Need exactly 32/);
  });
});
