import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Try to get the current season from DB
    const season = await prisma.cupSeason.findFirst({
      where: { status: { not: 'draft' } },
      orderBy: { createdAt: 'desc' },
      select: {
        name: true,
        status: true,
        qualificationStart: true,
        qualificationEnd: true,
        groupStart: true,
        groupEnd: true,
        r16Start: true,
        r16End: true,
        qfStart: true,
        qfEnd: true,
        sfStart: true,
        sfEnd: true,
        finalStart: true,
        finalEnd: true,
        prizePoolUsd: true,
        prizePoolToken: true,
        participantCount: true,
        championUserId: true,
      },
    });

    if (season) {
      return NextResponse.json({
        season: {
          name: season.name,
          status: season.status,
          phases: {
            qualify: { start: season.qualificationStart, end: season.qualificationEnd },
            groups: { start: season.groupStart, end: season.groupEnd },
            r16: { start: season.r16Start, end: season.r16End },
            qf: { start: season.qfStart, end: season.qfEnd },
            sf: { start: season.sfStart, end: season.sfEnd },
            final: { start: season.finalStart, end: season.finalEnd },
          },
          prizePoolUsd: season.prizePoolUsd,
          prizePoolToken: season.prizePoolToken,
          participantCount: season.participantCount,
        },
      });
    }

    // Fallback to env-based schedule if no season exists
    const fallback = {
      qualify: {
        start: process.env.CUP_QUALIFY_START || '2026-05-01T00:00:00Z',
        end: process.env.CUP_QUALIFY_END || '2026-05-29T00:00:00Z',
      },
      groups: {
        start: process.env.CUP_GROUPS_START || '2026-06-01T00:00:00Z',
        end: process.env.CUP_GROUPS_END || '2026-06-03T00:00:00Z',
      },
      r16: {
        start: process.env.CUP_R16_START || '2026-06-05T00:00:00Z',
        end: process.env.CUP_R16_END || '2026-06-07T00:00:00Z',
      },
      qf: {
        start: process.env.CUP_QF_START || '2026-06-10T00:00:00Z',
        end: process.env.CUP_QF_END || '2026-06-12T00:00:00Z',
      },
      sf: {
        start: process.env.CUP_SF_START || '2026-06-15T00:00:00Z',
        end: process.env.CUP_SF_END || '2026-06-17T00:00:00Z',
      },
      final: {
        start: process.env.CUP_FINAL_START || '2026-06-20T00:00:00Z',
        end: process.env.CUP_FINAL_END || '2026-06-23T00:00:00Z',
      },
    };

    return NextResponse.json({
      season: null,
      fallback,
      prizePoolUsd: parseFloat(process.env.CUP_PRIZE_POOL_USD || '0'),
      prizePoolToken: process.env.CUP_PRIZE_POOL_TOKEN || null,
    });
  } catch (error) {
    console.error('[cup/schedule] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}
