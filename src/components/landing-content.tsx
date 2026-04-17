'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Globe, ChevronRight, ExternalLink, Info, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { AvatarImage } from '@/components/avatar-image';
import { CutButton } from '@/components/cut-button';
import { PublicNav } from '@/components/public-nav';
import ShinyText from '@/components/shiny-text';
import DecryptedText from '@/components/decrypted-text';
import { LeaderboardTable } from '@/components/leaderboard-table';
import { ActivityTicker } from '@/components/activity-ticker';
import { JourneySection } from '@/components/journey-section';
import { ReferralSection } from '@/components/referral-section';
import { SectionRailNav } from '@/components/section-rail-nav';
import { SocialRail } from '@/components/social-rail';
import { getPublicAvatarUrl } from '@/lib/images';
import type { TickerItem } from '@/lib/types';

const DomeGallery = dynamic(() => import('@/components/DomeGallery'), { ssr: false });

interface TraderData {
  username: string;
  name: string;
  avatarUrl: string | null;
  pnl: string;
  pnlValue: number;
  winRate: string;
  winRateValue: number;
  trades: string;
  tradeCount: number;
  isDeployer?: boolean;
  topTrades: {
    id: string;
    token: string;
    tokenMint: string | null;
    tokenImage: string | null;
    pnlPercent: string;
    pnlPercentValue: number;
    buy: string | null;
    sell: string | null;
  }[];
  topDeployments?: {
    id: string;
    tokenSymbol: string;
    tokenImageUrl: string | null;
    status: string;
    mcapAthUsd: number | null;
    devPnlSol: number | null;
  }[];
}

interface LeaderboardTrader {
  rank: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isClaimed: boolean;
  pnlUsd: number;
  pnlSol: number;
  winRate: number;
  trades: number;
}

interface LandingContentProps {
  traders: TraderData[];
  featuredProfiles: TraderData[];
  ticker: TickerItem[];
  leaderboardData?: LeaderboardTrader[];
  refCode?: string | null;
}

type CupView = 'bracket' | 'leaderboard';

function CupInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative max-w-lg w-full max-h-[85vh] overflow-y-auto"
        style={{
          background: 'rgba(8,12,18,0.95)',
          border: '1px solid rgba(0,212,255,0.15)',
          clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-[var(--trench-text-muted)] hover:text-white transition-colors">
          <X size={18} />
        </button>
        <div className="p-6">
          <h3 className="text-xl font-black text-white mb-1">The Trencher Cup</h3>
          <p className="text-[12px] text-[var(--trench-text-muted)] mb-6">Season 1 — Live Trading Tournament</p>

          <div className="space-y-5">
            <div>
              <h4 className="text-[11px] font-mono tracking-[2px] text-[var(--trench-accent)] mb-2">HOW IT WORKS</h4>
              <p className="text-[13px] leading-relaxed text-[var(--trench-text)]">
                Top 32 traders by 7-day realized PnL qualify. They&apos;re split into 8 groups of 4. Top 2 from each group advance to knockout rounds (R16 → QF → SF → Final). Winner takes the crown and the biggest prize.
              </p>
            </div>

            <div>
              <h4 className="text-[11px] font-mono tracking-[2px] text-[var(--trench-accent)] mb-2">QUALIFICATION</h4>
              <ul className="text-[12px] leading-relaxed text-[var(--trench-text)] space-y-1">
                <li>• Link your Solana wallet via Privy</li>
                <li>• Trade on-chain — Helius tracks every swap</li>
                <li>• Top 32 by realized PnL in the qualification window qualify</li>
                <li>• Must have ≥ 10 trades to be eligible</li>
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-mono tracking-[2px] text-[var(--trench-accent)] mb-2">TOURNAMENT STRUCTURE</h4>
              <ul className="text-[12px] leading-relaxed text-[var(--trench-text)] space-y-1">
                <li>• <span className="text-white font-semibold">Group Stage:</span> 8 groups × 4 traders, top 2 advance</li>
                <li>• <span className="text-white font-semibold">Round of 16:</span> Head-to-head, 8 winners</li>
                <li>• <span className="text-white font-semibold">Quarter-Finals:</span> 4 winners advance</li>
                <li>• <span className="text-white font-semibold">Semi-Finals:</span> 2 winners advance</li>
                <li>• <span className="text-white font-semibold">Final:</span> 1 champion crowned</li>
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-mono tracking-[2px] text-[var(--trench-accent)] mb-2">SCORING</h4>
              <ul className="text-[12px] leading-relaxed text-[var(--trench-text)] space-y-1">
                <li>• <span className="text-white font-semibold">Primary:</span> Higher realized PnL during the match window wins</li>
                <li>• <span className="text-white font-semibold">Tiebreaker 1:</span> More trades during the window</li>
                <li>• <span className="text-white font-semibold">Tiebreaker 2:</span> Higher seed (lower rank)</li>
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-mono tracking-[2px] text-[var(--trench-accent)] mb-2">PRIZE POOL</h4>
              <ul className="text-[12px] leading-relaxed text-[var(--trench-text)] space-y-1">
                <li>• 🥇 Champion: 40% of pool</li>
                <li>• 🥈 Runner-up: 25%</li>
                <li>• 🥉 Semi-finalists: 10% each</li>
                <li>• Quarter-finalists: 3.75% each</li>
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-mono tracking-[2px] text-[var(--trench-accent)] mb-2">DATA SOURCES</h4>
              <p className="text-[12px] leading-relaxed text-[var(--trench-text)]">
                All PnL is calculated from real on-chain Solana transactions fetched via Helius API. No fake data, no paper trading — only verified swaps count.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CupCountdown({ label, endDate }: { label: string; endDate: Date }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = endDate.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('LIVE');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (days > 0) setTimeLeft(`${days}d ${hours}h`);
      else if (hours > 0) setTimeLeft(`${hours}h ${mins}m`);
      else setTimeLeft(`${mins}m`);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [endDate]);

  return (
    <div className="text-center">
      <div className="text-[8px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-1">{label}</div>
      <div
        className="text-[16px] sm:text-[18px] font-mono font-black leading-none text-white"
      >
        {timeLeft || '—'}
      </div>
    </div>
  );
}


// ─── Preview Card with Calendar/Chart toggle ───────────────

function buildPreviewCalendar(featured: TraderData) {
  const tradeCount = featured.tradeCount;
  const winRate = featured.winRateValue;
  const seed = featured.username
    .split('')
    .reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);

  return Array.from({ length: 56 }, (_, i) => {
    const wave = Math.sin((seed + i) * 0.73) * 0.5 + 0.5;
    const burst = Math.cos((seed + i * 3) * 0.41) * 0.5 + 0.5;
    const activity = Math.min(1, tradeCount / 120);
    const weighted = wave * 0.65 + burst * 0.35;
    const trades = weighted > 0.72
      ? Math.max(1, Math.round(weighted * (8 + activity * 10)))
      : weighted > 0.42
        ? Math.max(1, Math.round(weighted * (3 + activity * 6)))
        : 0;
    const edge = (winRate - 50) / 50;
    const pnl = trades > 0 ? Math.round(((weighted - 0.5) + edge * 0.35) * 700) : 0;
    const opacity = trades === 0 ? 0.05 : trades > 6 ? 0.8 : trades > 2 ? 0.4 : 0.15;
    const daysAgo = 55 - i;
    const date = new Date(Date.now() - daysAgo * 86400000);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { opacity, trades, pnl, label };
  });
}

function MiniCalendar({ featured }: { featured: TraderData }) {
  const [tooltip, setTooltip] = useState<{ label: string; pnl: number; trades: number; x: number; y: number } | null>(null);
  const calendarData = buildPreviewCalendar(featured);

  return (
    <>
      <div className="grid gap-[1.5px]" style={{ gridTemplateColumns: 'repeat(14, 1fr)', gridTemplateRows: 'repeat(4, 1fr)' }}>
        {calendarData.map((cell, i) => (
          <div
            key={i}
            className="aspect-square rounded-[1px] cursor-default"
            style={{ background: cell.pnl >= 0 ? `rgba(34,197,94,${cell.opacity})` : `rgba(239,68,68,${Math.max(0.08, cell.opacity)})`, minWidth: 4, minHeight: 4 }}
            onMouseEnter={(e) => {
              if (!cell.trades) return;
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltip({ label: cell.label, pnl: cell.pnl, trades: cell.trades, x: rect.left + rect.width / 2, y: rect.top });
            }}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </div>
      {tooltip && typeof document !== 'undefined' && createPortal(
        <div className="pointer-events-none fixed -translate-x-1/2" style={{ left: tooltip.x, top: tooltip.y - 10, zIndex: 9999 }}>
          <div className="px-2.5 py-1.5 whitespace-nowrap text-center" style={{ background: 'rgba(8,12,18,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', transform: 'translateY(-100%)' }}>
            <div className="text-[8px] font-mono text-[#888] mb-0.5">{tooltip.label}</div>
            <div className="text-[9px] font-mono font-bold" style={{ color: tooltip.pnl >= 0 ? '#22c55e' : '#ef4444' }}>{tooltip.pnl >= 0 ? '+' : ''}{tooltip.pnl} SOL</div>
            <div className="text-[8px] font-mono text-[#666]">{tooltip.trades} trades</div>
          </div>
          <div className="w-0 h-0 mx-auto" style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid rgba(255,255,255,0.1)' }} />
        </div>,
        document.body
      )}
    </>
  );
}

function getValueTone(value: number) {
  return value >= 0
    ? { color: '#22c55e', shadow: '0 0 12px rgba(34,197,94,0.2)' }
    : { color: '#ef4444', shadow: '0 0 12px rgba(239,68,68,0.18)' };
}

function PreviewCardInner({ featured }: { featured: TraderData }) {
  const featuredProfileLabel = `web3me.fun/${featured.username}`;
  const profileHref = `/${featured.username}`;
  const pnlTone = getValueTone(featured.pnlValue);
  const hasTopTrades = featured.topTrades.length > 0;
  
  // Find the single best trade to highlight prominently
  const bestTrade = hasTopTrades 
    ? [...featured.topTrades].sort((a, b) => b.pnlPercentValue - a.pnlPercentValue)[0] 
    : null;

  return (
    <div className="w-full h-full flex flex-col" style={{ transform: 'perspective(1000px) rotateY(-4deg) rotateX(2deg)' }}>
      <div className="flex-1 flex flex-col" style={{ background: 'rgba(8,12,18,0.72)' }}>
        {/* Profile header with metrics on right */}
        <div className="px-5 pt-5 pb-3 relative">
          <div className="flex items-start gap-3.5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="overflow-hidden" style={{ width: 56, height: 56, clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)', border: '2px solid rgba(0,212,255,0.35)', boxShadow: '0 0 20px rgba(0,212,255,0.15)' }}>
                <AvatarImage
                  src={getPublicAvatarUrl(featured.username, featured.avatarUrl, { isDeployer: featured.isDeployer })}
                  alt={featured.name}
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full" style={{ background: '#00D4FF', border: '2px solid rgba(8,12,18,0.9)' }}>
                <Check size={9} strokeWidth={3} className="text-black" />
              </div>
            </div>

            {/* Name + handle */}
            <div className="flex-1 min-w-0 pt-0.5">
              <span className="text-[15px] font-bold text-white leading-tight truncate block">{featured.name}</span>
              <div className="text-[11px] text-[var(--trench-text-muted)]">@{featured.username}</div>
              <div className="text-[18px] font-black font-mono mt-1" style={{ color: pnlTone.color, textShadow: pnlTone.shadow }}>{featured.pnl}</div>
            </div>

            {/* Metrics stacked vertically — absolute right */}
            <div className="absolute top-5 right-5 flex flex-col gap-1.5">
              {[
                { val: featured.winRate, label: 'WIN RATE' },
                { val: featured.trades, label: 'TRADES' },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-end">
                  <span className="font-mono text-[12px] font-bold text-white leading-none">{s.val}</span>
                  <span className="text-[6px] tracking-[1px] text-[var(--trench-text-muted)] mt-0.5">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent)' }} />

        {/* TOP TRADE HIGHLIGHT — More visible singular component */}
        {bestTrade && (
          <div className="px-5 py-4">
            <div className="text-[7px] font-mono tracking-[2px] text-[var(--trench-accent)] mb-2 uppercase">Best Verified Trade</div>
            <div 
              className="group relative px-4 py-3 transition-all hover:bg-white/[0.04]"
              style={{ 
                background: 'rgba(0,212,255,0.04)', 
                border: '1px solid rgba(0,212,255,0.15)',
                clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)'
              }}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-full border border-[rgba(0,212,255,0.3)] bg-black/40 flex-shrink-0">
                  {bestTrade.tokenImage ? (
                    <Image src={bestTrade.tokenImage} alt={bestTrade.token} width={40} height={40} className="h-full w-full object-cover" unoptimized />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs font-bold text-white">{bestTrade.token.slice(0,2)}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-black text-white truncate">{bestTrade.token}</span>
                    <span className="text-[16px] font-black font-mono text-[var(--trench-green)]">{bestTrade.pnlPercent}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[9px] font-mono">
                    {bestTrade.buy && <div className="text-[var(--trench-text-muted)]">IN <span className="text-white">{bestTrade.buy} SOL</span></div>}
                    {bestTrade.sell && <div className="text-[var(--trench-text-muted)]">OUT <span className="text-[var(--trench-green)]">{bestTrade.sell} SOL</span></div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TRADE HISTORY — GitHub style heatmap, more visible */}
        <div className="px-5 py-3">
          <div className="text-[7px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-2 uppercase">16-Week Trading Pulse</div>
          <div 
            className="px-3 py-3"
            style={{ 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid rgba(255,255,255,0.05)',
              clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)'
            }}
          >
            <MiniCalendar featured={featured} />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-[8px] font-mono text-[var(--trench-text-muted)] flex items-center gap-1.5">
              <span>Less</span>
              <div className="flex gap-1">
                {[0.1, 0.4, 0.7, 1.0].map(o => (
                  <div key={o} className="w-2 h-2 rounded-[1px]" style={{ background: `rgba(34,197,94,${o})` }} />
                ))}
              </div>
              <span>More</span>
            </div>
            <Link href={profileHref} className="text-[9px] font-bold text-[var(--trench-accent)] hover:underline flex items-center gap-1">
              FULL PROFILE <ChevronRight size={10} />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto flex justify-center py-2.5 border-t border-[rgba(255,255,255,0.04)]">
          <Image src="/logo.png" alt="Web3Me" width={80} height={20} className="h-4 w-auto opacity-30" />
        </div>
      </div>
    </div>
  );
}

function PreviewCardCarousel({ profiles }: { profiles: TraderData[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (profiles.length <= 1) return;
    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % profiles.length);
    }, 5200);

    return () => window.clearInterval(interval);
  }, [profiles.length]);

  if (profiles.length === 0) return null;

  return (
    <div className="relative h-full w-full">
      <div className="h-full w-full overflow-hidden">
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ width: `${profiles.length * 100}%`, transform: `translateX(-${index * (100 / profiles.length)}%)` }}
        >
          {profiles.map((profile) => (
            <div key={profile.username} className="h-full" style={{ width: `${100 / profiles.length}%` }}>
              <PreviewCardInner featured={profile} />
            </div>
          ))}
        </div>
      </div>

      {profiles.length > 1 && (
        <>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {profiles.map((profile, profileIndex) => (
              <div
                key={profile.username}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: profileIndex === index ? 18 : 8,
                  background: profileIndex === index ? '#00D4FF' : 'rgba(255,255,255,0.24)',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function LandingContent({ traders, featuredProfiles, ticker, leaderboardData, refCode }: LandingContentProps) {
  const [cupView, setCupView] = useState<CupView>('bracket');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const authUser = useAuthStore((s) => s.user);
  const [cupSchedule, setCupSchedule] = useState<{
    qualifyEnd: Date;
    groupsEnd: Date;
    r16End: Date;
    qfSfEnd: Date;
    finalEnd: Date;
  } | null>(null);

  // Fetch cup schedule from API
  useEffect(() => {
    fetch('/api/cup/schedule')
      .then((r) => r.json())
      .then((data) => {
        if (data.season) {
          setCupSchedule({
            qualifyEnd: new Date(data.season.phases.qualify.end),
            groupsEnd: new Date(data.season.phases.groups.end),
            r16End: new Date(data.season.phases.r16.end),
            qfSfEnd: new Date(data.season.phases.sf.end),
            finalEnd: new Date(data.season.phases.final.end),
          });
        } else if (data.fallback) {
          setCupSchedule({
            qualifyEnd: new Date(data.fallback.qualify.end),
            groupsEnd: new Date(data.fallback.groups.end),
            r16End: new Date(data.fallback.r16.end),
            qfSfEnd: new Date(data.fallback.sf.end),
            finalEnd: new Date(data.fallback.final.end),
          });
        }
      })
      .catch(() => {
        // Hard fallback
        setCupSchedule({
          qualifyEnd: new Date('2026-05-29T00:00:00Z'),
          groupsEnd: new Date('2026-06-03T00:00:00Z'),
          r16End: new Date('2026-06-07T00:00:00Z'),
          qfSfEnd: new Date('2026-06-17T00:00:00Z'),
          finalEnd: new Date('2026-06-23T00:00:00Z'),
        });
      });
  }, []);

  // Capture referral code from URL into localStorage + HttpOnly cookie
  useEffect(() => {
    if (!refCode) return;
    localStorage.setItem('web3me_ref', refCode);
    fetch('/api/referral/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: refCode }),
    }).catch(() => {});
  }, [refCode]);

  const domeImages = traders.map((trader) => ({
    src: getPublicAvatarUrl(trader.username, trader.avatarUrl),
    alt: `${trader.name} profile image`,
    title: trader.name,
    subtitle: '',
    metric: '',
    href: `/${trader.username}`,
  }));
  return (
    <div className="relative min-h-screen" style={{ background: 'transparent' }}>
      <PublicNav />
      <SectionRailNav />
      <SocialRail />


      {/* Logged-in indicator */}
      {authUser && (
        <div
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3 py-2"
          style={{
            background: 'rgba(8,12,18,0.9)',
            border: '1px solid rgba(0,212,255,0.2)',
            clipPath: 'polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" style={{ boxShadow: '0 0 6px rgba(34,197,94,0.6)' }} />
          <span className="text-[10px] font-mono text-[var(--trench-text-muted)]">
            Logged in as <Link href="/dashboard" className="text-[var(--trench-accent)] hover:opacity-80 transition-opacity">@{authUser.username}</Link>
          </span>
        </div>
      )}

      <div className="relative" style={{ zIndex: 2 }}>
        {/* Activity Ticker */}
        <ActivityTicker items={ticker} />

        {/* Hero */}
        <section id="hero" className="mx-auto flex flex-col items-center justify-center scroll-mt-36 px-4 pt-16 pb-12 sm:pt-20 sm:pb-16 sm:px-6 lg:pt-24 lg:pb-20 pointer-events-none relative z-10">
          <div className="pointer-events-auto text-center">
            <div className="cut-xs mb-4 sm:mb-6 inline-flex items-center gap-1.5 border border-[rgba(0,212,255,0.12)] bg-[rgba(0,212,255,0.08)] px-2.5 py-1 sm:px-3 text-[8px] sm:text-[10px] font-mono tracking-[2px] text-[var(--trench-accent)]">
              <Check size={8} strokeWidth={3} className="sm:w-[10px] sm:h-[10px]" />
              <ShinyText text="ON-CHAIN VERIFIED" speed={3} />
            </div>

            <h1 className="mb-4 sm:mb-5 text-7xl sm:text-8xl md:text-9xl lg:text-[150px] leading-[1.0] font-black tracking-tight text-white">
              <span className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <span>Your</span>
                <span className="relative inline-block" style={{ width: '1.3em', height: '1.3em' }}>
                  <Image
                    src="/hero-logo.png"
                    alt="Web3Me"
                    fill
                    className="object-contain"
                  />
                </span>
                <span className="text-[var(--trench-accent)]">ID</span>
              </span>
            </h1>

            <p className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-white leading-snug max-w-sm">
              The trading identity the trenches deserve.
            </p>

            <p className="mb-6 sm:mb-8 max-w-sm text-[13px] sm:text-sm leading-relaxed text-[var(--trench-text-muted)]">
              Your Solana PnL, verified on-chain and displayed in one shareable link. Compete in the Trencher Cup — 32 traders, one champion, real money on the line.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <CutButton href="/dashboard" size="lg">Participate</CutButton>
            </div>
            <p className="mt-3 sm:mt-4 text-[7px] sm:text-[9px] font-mono tracking-[2px] text-[var(--trench-text-muted)]">LANDING &middot; LEADERBOARD &middot; DASHBOARD</p>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-[920px] px-6 sm:px-12 lg:px-16">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
        </div>

        {/* Leaderboard Section */}
        <section id="leaderboard" className="relative mx-auto max-w-[920px] scroll-mt-36 px-6 py-10 sm:px-12 sm:py-16 lg:px-16">
          <div className="mb-8 text-center">
            <div className="mb-4 flex items-center justify-center gap-4">
              <div className="h-px flex-1 max-w-[120px]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.55) 55%, rgba(0,212,255,0.08) 100%)' }} />
              <div className="text-[11px] font-mono tracking-[3px] uppercase" style={{ color: 'rgba(0,212,255,0.75)' }}>
                Rankings
              </div>
              <div className="h-px flex-1 max-w-[120px]" style={{ background: 'linear-gradient(90deg, rgba(0,212,255,0.08) 0%, rgba(0,212,255,0.55) 45%, transparent 100%)' }} />
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">
              Top <span style={{ color: '#00D4FF' }}>Traders</span>
            </h2>
            <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-relaxed text-[var(--trench-text-muted)]">
              Realized PnL from verified on-chain Solana trades. Updated hourly via Helius.
            </p>
          </div>

          <LeaderboardTable
            initialPeriod="all"
            initialTraders={leaderboardData}
            variant="full"
            availableModes={['traders']}
          />
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-[920px] px-6 sm:px-12 lg:px-16">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
        </div>

        {/* The Trencher Cup */}
        <section id="cup" className="relative mx-auto max-w-[920px] scroll-mt-36 px-6 py-10 sm:px-12 sm:py-16 lg:px-16">
          <div className="mb-8 text-center">
            <div className="mb-4 flex items-center justify-center gap-4">
              <div className="h-px flex-1 max-w-[120px]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.55) 55%, rgba(0,212,255,0.08) 100%)' }} />
              <div className="text-[11px] font-mono tracking-[3px] uppercase" style={{ color: 'rgba(0,212,255,0.75)' }}>
                Tournament
              </div>
              <div className="h-px flex-1 max-w-[120px]" style={{ background: 'linear-gradient(90deg, rgba(0,212,255,0.08) 0%, rgba(0,212,255,0.55) 45%, transparent 100%)' }} />
            </div>
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">
                The Trencher <span style={{ color: '#00D4FF' }}>Cup</span>
              </h2>
              <button
                onClick={() => setShowInfoModal(true)}
                className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-[rgba(0,212,255,0.08)] transition-colors"
                style={{ border: '1px solid rgba(0,212,255,0.15)' }}
                aria-label="Tournament info"
              >
                <Info size={16} style={{ color: 'rgba(0,212,255,0.75)' }} />
              </button>
            </div>
            <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-relaxed text-[var(--trench-text-muted)]">
              Top 32 traders by 7-day realized PnL qualify for the cup. Groups → Knockout → Champion.
            </p>
          </div>

          {/* Countdown Timers */}
          <div className="mb-8 grid grid-cols-2 sm:grid-cols-5 gap-4">
            <CupCountdown label="QUALIFY" endDate={cupSchedule?.qualifyEnd || new Date('2026-05-29T00:00:00Z')} />
            <CupCountdown label="GROUPS" endDate={cupSchedule?.groupsEnd || new Date('2026-06-03T00:00:00Z')} />
            <CupCountdown label="R16" endDate={cupSchedule?.r16End || new Date('2026-06-07T00:00:00Z')} />
            <CupCountdown label="QF → SF" endDate={cupSchedule?.qfSfEnd || new Date('2026-06-17T00:00:00Z')} />
            <CupCountdown label="FINAL" endDate={cupSchedule?.finalEnd || new Date('2026-06-23T00:00:00Z')} />
          </div>

          {/* Live Match Tracker (only shows during active tournament) */}
          {/* Disabled during qualifying — uncomment when tournament rounds start */}
          {/* <LiveMatchTracker /> */}

          {/* Bracket / Toggle */}
          <div className="relative z-30 mb-5 flex justify-end pointer-events-auto">
            <CutButton
              onClick={() =>
                setCupView((current) =>
                  current === 'bracket' ? 'leaderboard' : 'bracket',
                )
              }
              variant="secondary"
              size="sm"
            >
              {cupView === 'bracket' ? 'SHOW TABLE' : 'SHOW BRACKET'}
            </CutButton>
          </div>

          <LeaderboardTable
            initialPeriod="all"
            initialTraders={leaderboardData}
            variant={cupView === 'bracket' ? 'bracket' : 'full'}
            availableModes={['traders']}
          />
        </section>

        {/* Info Modal */}
        {showInfoModal && <CupInfoModal onClose={() => setShowInfoModal(false)} />}

        {/* Journey — merged How it works + Reward Pool */}
        <div id="journey" className="scroll-mt-36">
          <JourneySection />
        </div>

        {/* Divider */}
        <div className="mx-auto max-w-[920px] px-6 sm:px-12 lg:px-16">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
        </div>

        {/* Referral Section */}
        <div id="referrals" className="scroll-mt-36">
          <ReferralSection />
        </div>

        {/* Divider */}
        <div className="mx-auto max-w-[920px] px-6 sm:px-12 lg:px-16">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)' }} />
        </div>

        {/* Top Traders — gallery is the page ending */}
        <section id="traders" className="relative scroll-mt-36">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(5,5,8,0.4) 40%, rgba(5,5,8,0.7) 100%)' }} />

          <div className="h-[520px] w-full relative">
            <DomeGallery
              images={domeImages}
              fit={0.8}
              minRadius={500}
              maxVerticalRotationDeg={0}
              segments={34}
              dragDampening={2}
              grayscale={false}
            />
          </div>

          {/* Footer — overlaid at bottom of gallery */}
          <div className="absolute bottom-0 left-0 right-0 py-4 text-center z-10">
            <Link href="/" className="mb-1 inline-block">
              <Image src="/logo.png" alt="Web3Me" width={96} height={24} className="mx-auto h-5 w-auto opacity-20 transition-opacity hover:opacity-40" />
            </Link>
            <br />
            <span className="text-[8px] font-mono tracking-[2px] text-[rgba(255,255,255,0.15)]">WEB3ME &middot; SOLANA &middot; 2026</span>
          </div>
        </section>
      </div>
    </div>
  );
}
