import { prisma } from '@/lib/prisma';
import { BackgroundLayer } from '@/components/background-layer';
import { LeaderboardTable } from '@/components/leaderboard-table';
import { CutButton } from '@/components/cut-button';
import { PublicNav } from '@/components/public-nav';
import { resolveAvatarRows } from '@/lib/avatar-resolution';

export const dynamic = 'force-dynamic';

const DEV_BOT_USERNAMES = new Set(['dev-bot']);
const DEV_PREFIXES = ['dev_', 'dev-'];
const DEV_PATTERNS = ['_axiom', '_trader'];

function isDevAccount(username: string): boolean {
  if (DEV_BOT_USERNAMES.has(username)) return true;
  if (DEV_PREFIXES.some(prefix => username.startsWith(prefix))) return true;
  if (DEV_PATTERNS.some(pattern => username.includes(pattern))) return true;
  return false;
}

async function getInitialTraderRankings() {
  const rankedRows = await prisma.userRanking.findMany({
    where: { period: '7d', trades: { gt: 0 }, rank: { not: null } },
    orderBy: { rank: 'asc' },
    take: 50,
    include: {
      user: {
        select: {
          username: true,
          displayName: true,
          avatarUrl: true,
          isClaimed: true,
        },
      },
    },
  });

  // Filter out dev accounts
  const filteredRanked = rankedRows.filter(r => !isDevAccount(r.user.username));

  const rankings =
    filteredRanked.length > 0
      ? filteredRanked
      : await prisma.userRanking.findMany({
          where: { period: '7d', trades: { gt: 0 } },
          orderBy: [
            { pnlUsd: 'desc' },
            { winRate: 'desc' },
            { trades: 'desc' },
            { userId: 'asc' },
          ],
          take: 50,
          include: {
            user: {
              select: {
                username: true,
                displayName: true,
                avatarUrl: true,
                isClaimed: true,
              },
            },
          },
        }).then(rows => rows.filter(r => !isDevAccount(r.user.username)));

  return resolveAvatarRows(rankings.map((ranking, index) => ({
    rank: ranking.rank ?? index + 1,
    username: ranking.user.username,
    displayName: ranking.user.displayName,
    avatarUrl: ranking.user.avatarUrl,
    isClaimed: ranking.user.isClaimed,
    pnlUsd: ranking.pnlUsd,
    pnlSol: ranking.pnlSol,
    winRate: ranking.winRate,
    trades: ranking.trades,
  })));
}

export default async function LeaderboardPage() {
  const initialTraders = await getInitialTraderRankings();

  return (
    <div className="relative min-h-screen" style={{ background: '#050508' }}>
      <PublicNav />

      <BackgroundLayer />

      <div className="relative" style={{ zIndex: 2 }}>
        <div className="mx-auto max-w-[980px] px-6 pt-10 pb-20">
          <section className="mb-10">
            <div className="mb-8 text-right">
              <div
                className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-mono tracking-[2px] text-[var(--trench-accent)]"
                style={{
                  background: 'rgba(0,212,255,0.08)',
                  border: '1px solid rgba(0,212,255,0.12)',
                  clipPath:
                    'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                }}
              >
                LEADERBOARD
              </div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">
                Top <span className="text-[var(--trench-accent)]">Traders</span> and{' '}
                <span className="text-[var(--trench-accent)]">Devs</span>
              </h1>
              <p className="ml-auto mt-2 max-w-[620px] text-[12px] text-[var(--trench-text-muted)]">
                Switch between trader and deployer rankings from one page. Trader rankings feed the
                Trencher Cup, which sits directly below as the tournament surface for the top 32.
              </p>
            </div>

            <LeaderboardTable initialPeriod="7d" initialTraders={initialTraders} />
          </section>

          <section
            id="trencher-cup"
            className="cut-sm border border-[rgba(0,212,255,0.08)] px-4 py-6 sm:px-6 sm:py-8"
            style={{ background: 'rgba(8,12,18,0.35)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
          >
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 text-[9px] font-mono tracking-[3px] text-[var(--trench-accent)]">
                  TRENCHER CUP
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Top 32 trader bracket
                </h2>
                <p className="mt-2 max-w-[560px] text-[12px] leading-relaxed text-[var(--trench-text-muted)]">
                  The cup is trader-only. Qualification is driven by the 7-day trader leaderboard,
                  so this block stays directly attached to the ranking surface.
                </p>
              </div>

              <CutButton href="/dashboard" variant="secondary" size="sm">
                Open Dashboard
              </CutButton>
            </div>

            <LeaderboardTable
              initialPeriod="7d"
              initialTraders={initialTraders}
              variant="bracket"
              availableModes={['traders']}
            />
          </section>
        </div>

        <div className="mx-auto max-w-[980px] border-t border-[rgba(0,212,255,0.06)] px-6 py-6 text-center">
          <div className="mb-2">
            <CutButton href="/dashboard" variant="secondary" size="sm">
              Open Dashboard
            </CutButton>
          </div>
          <span className="text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">
            WEB3ME &middot; LANDING &middot; LEADERBOARD &middot; DASHBOARD
          </span>
        </div>
      </div>
    </div>
  );
}
