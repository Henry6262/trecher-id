/**
 * Slack notifications for tournament events.
 * Uses existing SLACK_WEBHOOK_URL env var.
 */

export type TournamentEvent =
  | 'season_start'
  | 'qualifying_close'
  | 'groups_start'
  | 'groups_complete'
  | 'r16_start'
  | 'r16_complete'
  | 'qf_start'
  | 'qf_complete'
  | 'sf_start'
  | 'sf_complete'
  | 'final_start'
  | 'champion_crowned';

interface TournamentNotificationInput {
  event: TournamentEvent;
  seasonName: string;
  data?: Record<string, string | number>;
}

export async function sendTournamentNotification(input: TournamentNotificationInput): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return false;

  const messages: Record<TournamentEvent, string> = {
    season_start: `🏆 *${input.seasonName}* has officially begun! Qualification window is now open.`,
    qualifying_close: `⏰ Qualification for *${input.seasonName}* closes soon. Make your trades count!`,
    groups_start: `🎯 Group Stage for *${input.seasonName}* is LIVE! 8 groups competing, top 2 advance.`,
    groups_complete: `✅ Group Stage complete! Top 16 advance to Round of 16.`,
    r16_start: `⚔️ Round of 16 is LIVE! Head-to-head battles begin.`,
    r16_complete: `✅ R16 complete! 8 traders advance to Quarter-Finals.`,
    qf_start: `🔥 Quarter-Finals are LIVE!`,
    qf_complete: `✅ QF complete! 4 traders advance to Semi-Finals.`,
    sf_start: `💥 Semi-Finals are LIVE!`,
    sf_complete: `✅ SF complete! 2 traders advance to the FINAL.`,
    final_start: `🏆 THE FINAL IS LIVE! Two traders. One champion. 72 hours.`,
    champion_crowned: `👑 *CHAMPION CROWNED!* ${input.data?.champion ?? 'Unknown'} wins *${input.seasonName}*!`,
  };

  const text = messages[input.event] ?? `Tournament event: ${input.event}`;

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
