
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  getCurrentSeason, 
  refreshLiveMatches, 
  advanceRound, 
  drawGroups,
  type CupStatus 
} from '@/lib/cup-engine';

export const maxDuration = 300;

async function notifySlack(text: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return false;

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const vercelCron = req.headers.get('x-vercel-cron');
  const cronSecret = process.env.CRON_SECRET;
  const isVercelCron = vercelCron === '1' && process.env.NODE_ENV === 'production';
  const isManualAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isVercelCron && !isManualAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const summary: any = {
    timestamp: now.toISOString(),
    actions: [],
  };

  try {
    // Get all non-completed seasons
    const activeSeasons = await prisma.cupSeason.findMany({
      where: { status: { not: 'completed' } },
    });

    for (const season of activeSeasons) {
      const seasonAction: any = {
        name: season.name,
        slug: season.slug,
        currentStatus: season.status,
        transitions: [],
      };

      // 1. REFRESH LIVE MATCHES
      // If we are in an active tournament phase (groups, r16, etc.), refresh PnL
      const activePhases = ['groups', 'r16', 'qf', 'sf', 'final'];
      if (activePhases.includes(season.status)) {
        const refreshed = await refreshLiveMatches(season.id);
        seasonAction.refreshedMatches = refreshed.length;
      }

      // 2. CHECK FOR PHASE TRANSITIONS
      let nextStatus: CupStatus | null = null;

      if (season.status === 'qualifying' && now >= season.groupStart) {
        // Qualification ended -> Draw Groups and move to groups
        try {
          await drawGroups(season.id);
          nextStatus = 'groups';
          seasonAction.transitions.push('qualifying -> groups');
        } catch (e: any) {
          seasonAction.error = `Group draw failed: ${e.message}`;
        }
      } else if (season.status === 'groups' && now >= season.r16Start) {
        nextStatus = 'r16';
        seasonAction.transitions.push('groups -> r16');
      } else if (season.status === 'r16' && now >= season.qfStart) {
        nextStatus = 'qf';
        seasonAction.transitions.push('r16 -> qf');
      } else if (season.status === 'qf' && now >= season.sfStart) {
        nextStatus = 'sf';
        seasonAction.transitions.push('qf -> sf');
      } else if (season.status === 'sf' && now >= season.finalStart) {
        nextStatus = 'final';
        seasonAction.transitions.push('sf -> final');
      } else if (season.status === 'final' && now >= season.finalEnd) {
        nextStatus = 'completed';
        seasonAction.transitions.push('final -> completed');
      }

      // If a transition is needed, advance the round
      if (nextStatus) {
        const result = await advanceRound(season.id, nextStatus);
        seasonAction.newStatus = result.season.status;
        
        await notifySlack(
          `🏆 *Tournament Transition*: ${season.name} moved to *${nextStatus.toUpperCase()}* phase.`
        );
      }

      summary.actions.push(seasonAction);
    }

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('[tournament-manager] failed:', error);
    await notifySlack(`❌ *Tournament Manager Error*: ${error.message}`);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
