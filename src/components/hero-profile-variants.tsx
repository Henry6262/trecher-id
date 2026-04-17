'use client';

import Image from 'next/image';
import { Check, Globe } from 'lucide-react';
import { AvatarImage } from '@/components/avatar-image';
import { getPublicAvatarUrl, normalizeImageUrl } from '@/lib/images';

interface HeroProfileData {
  username: string;
  name: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  pnl: string;
  pnlValue: number;
  winRate: string;
  winRateValue: number;
  trades: string;
  tradeCount: number;
  topTrades: {
    id: string;
    token: string;
    tokenImage: string | null;
    pnlPercent: string;
    pnlPercentValue: number;
    buy: string | null;
    sell: string | null;
  }[];
}

function buildPreviewCalendar(featured: HeroProfileData) {
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
    const opacity = trades === 0 ? 0.05 : trades > 6 ? 0.78 : trades > 2 ? 0.42 : 0.16;
    return { opacity, pnl };
  });
}

function tone(value: number) {
  return value >= 0 ? '#7FE17B' : '#FF6B6B';
}

function CardShell({
  featured,
  label,
  children,
}: {
  featured: HeroProfileData;
  label: string;
  children: React.ReactNode;
}) {
  const banner = normalizeImageUrl(featured.bannerUrl);

  return (
    <section className="space-y-3">
      <div className="flex items-center">
        <div className="text-[11px] font-mono tracking-[3px] text-[rgba(0,212,255,0.75)]">{label}</div>
      </div>
      <div
        className="relative overflow-hidden"
        style={{
          minHeight: 470,
          borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(8,12,18,0.88)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
        }}
      >
        {banner && (
          <>
            <div className="absolute inset-0">
              <Image src={banner} alt="" fill className="object-cover" unoptimized />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,12,0.38)_0%,rgba(5,8,12,0.6)_24%,rgba(5,8,12,0.88)_58%,rgba(5,8,12,0.96)_100%)]" />
            <div className="absolute inset-y-0 left-0 w-[44%] bg-[linear-gradient(90deg,rgba(5,8,12,0.96)_0%,rgba(5,8,12,0.74)_48%,rgba(5,8,12,0)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-[40%] bg-[linear-gradient(180deg,rgba(5,8,12,0)_0%,rgba(5,8,12,0.92)_100%)]" />
          </>
        )}
        {!banner && <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,212,255,0.16),transparent_34%),linear-gradient(180deg,#070b10_0%,#040608_100%)]" />}
        <div className="relative z-10 h-full p-6 sm:p-7">{children}</div>
      </div>
    </section>
  );
}

function Identity({ featured }: { featured: HeroProfileData }) {
  return (
    <div className="flex items-start gap-4">
      <div className="relative h-16 w-16 overflow-hidden rounded-[18px]" style={{ border: '2px solid rgba(0,212,255,0.35)' }}>
        <AvatarImage
          src={getPublicAvatarUrl(featured.username, featured.avatarUrl)}
          alt={featured.name}
          width={64}
          height={64}
          className="h-full w-full object-cover"
        />
        <div className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#00D4FF] text-black">
          <Check size={9} strokeWidth={3} />
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-[24px] font-black leading-none text-white sm:text-[28px]">{featured.name}</div>
        <div className="mt-1 text-[12px] font-mono tracking-[2px] text-[rgba(255,255,255,0.58)]">@{featured.username}</div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-mono text-[rgba(255,255,255,0.68)] backdrop-blur-sm">
          <Globe size={13} className="text-[rgba(0,212,255,0.72)]" />
          web3me.fun/{featured.username}
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value, valueTone, note }: { label: string; value: string; valueTone?: string; note?: string }) {
  return (
    <div
      className="px-4 py-3"
      style={{
        borderRadius: '6px',
        background: 'rgba(7,10,16,0.72)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="text-[9px] font-mono tracking-[3px] text-[rgba(255,255,255,0.42)]">{label}</div>
      <div className="mt-2 text-[28px] font-black leading-none" style={{ color: valueTone ?? '#fff' }}>{value}</div>
      {note && <div className="mt-2 text-[10px] font-mono tracking-[2px] text-[rgba(255,255,255,0.54)]">{note}</div>}
    </div>
  );
}

function TradeChip({ trade }: { trade: HeroProfileData['topTrades'][number] }) {
  return (
    <div
      className="min-w-[210px] px-3 py-3"
      style={{
        borderRadius: '6px',
        background: 'rgba(7,10,16,0.74)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <div className="relative h-9 w-9 overflow-hidden rounded-full border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.08)]">
          {trade.tokenImage ? (
            <Image src={trade.tokenImage} alt={trade.token} fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white">
              {trade.token.replace('$', '').slice(0, 2)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[11px] font-bold text-white">{trade.token}</div>
          <div className="text-[11px] font-mono font-bold" style={{ color: tone(trade.pnlPercentValue) }}>{trade.pnlPercent}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[8px] font-mono tracking-[1.5px] text-[rgba(255,255,255,0.5)]">
        <div className="rounded-[4px] border border-white/6 bg-white/[0.03] px-2 py-1">BUY <span className="text-white">{trade.buy ?? '—'}</span></div>
        <div className="rounded-[4px] border border-white/6 bg-white/[0.03] px-2 py-1">SELL <span style={{ color: tone(trade.pnlPercentValue) }}>{trade.sell ?? '—'}</span></div>
      </div>
    </div>
  );
}

function CalendarStrip({ featured }: { featured: HeroProfileData }) {
  const cells = buildPreviewCalendar(featured);
  return (
    <div className="grid gap-[2px]" style={{ gridTemplateColumns: 'repeat(14, 1fr)', gridTemplateRows: 'repeat(4, 1fr)' }}>
      {cells.map((cell, index) => (
        <div
          key={index}
          className="aspect-square rounded-[2px]"
          style={{ background: cell.pnl >= 0 ? `rgba(127,225,123,${cell.opacity})` : `rgba(255,107,107,${Math.max(0.1, cell.opacity)})` }}
        />
      ))}
    </div>
  );
}

function VariantA({ featured }: { featured: HeroProfileData }) {
  return (
    <CardShell featured={featured} label="VARIANT A / CINEMATIC BANNER">
      <div className="flex h-full flex-col justify-between gap-6">
        <div className="flex items-start justify-between gap-6">
          <Identity featured={featured} />
          <div className="grid w-[260px] grid-cols-2 gap-3">
            <StatBlock label="TOTAL PNL" value={featured.pnl} valueTone={tone(featured.pnlValue)} />
            <StatBlock label="WIN RATE" value={featured.winRate} />
            <StatBlock label="TRADES" value={featured.trades} />
            <StatBlock label="PROFILE" value="LIVE" valueTone="#59C8FF" note="ON-CHAIN VERIFIED" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-[10px] font-mono tracking-[3px] text-[rgba(255,255,255,0.42)]">TOP TRADES</div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {featured.topTrades.map((trade) => <TradeChip key={trade.id} trade={trade} />)}
          </div>
        </div>
      </div>
    </CardShell>
  );
}

function VariantB({ featured }: { featured: HeroProfileData }) {
  return (
    <CardShell featured={featured} label="VARIANT B / PROFILE OPS PANEL">
      <div className="grid h-full gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="flex flex-col justify-between">
          <div className="space-y-5">
            <Identity featured={featured} />
            <div className="grid gap-3">
              <StatBlock label="TOTAL PNL" value={featured.pnl} valueTone={tone(featured.pnlValue)} note="LAST 7 DAYS" />
              <div className="grid grid-cols-2 gap-3">
                <StatBlock label="WIN RATE" value={featured.winRate} />
                <StatBlock label="TRADES" value={featured.trades} />
              </div>
            </div>
          </div>
          <div
            className="px-4 py-3"
            style={{
              borderRadius: '6px',
              background: 'rgba(7,10,16,0.76)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="text-[9px] font-mono tracking-[3px] text-[rgba(255,255,255,0.42)]">TRADE HISTORY</div>
            <div className="mt-3">
              <CalendarStrip featured={featured} />
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-end gap-3">
          <div className="text-[10px] font-mono tracking-[3px] text-[rgba(255,255,255,0.42)]">HIGHLIGHTED WINS</div>
          {featured.topTrades.map((trade) => (
            <div
              key={trade.id}
              className="grid items-center gap-4 px-4 py-3 sm:grid-cols-[44px_minmax(0,1fr)_110px_110px]"
              style={{
                borderRadius: '6px',
                background: 'rgba(7,10,16,0.76)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="relative h-11 w-11 overflow-hidden rounded-full border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.08)]">
                {trade.tokenImage ? (
                  <Image src={trade.tokenImage} alt={trade.token} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[11px] font-bold text-white">
                    {trade.token.replace('$', '').slice(0, 2)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12px] font-bold text-white">{trade.token}</div>
                <div className="text-[10px] font-mono tracking-[2px] text-[rgba(255,255,255,0.5)]">FEATURED TRADE</div>
              </div>
              <div className="rounded-[4px] border border-white/6 bg-white/[0.03] px-3 py-2 text-[9px] font-mono tracking-[2px] text-[rgba(255,255,255,0.54)]">
                BUY <span className="ml-1 text-white">{trade.buy ?? '—'}</span>
              </div>
              <div className="rounded-[4px] border border-white/6 bg-white/[0.03] px-3 py-2 text-[9px] font-mono tracking-[2px] text-[rgba(255,255,255,0.54)]">
                <span style={{ color: tone(trade.pnlPercentValue) }}>{trade.pnlPercent}</span>
                <span className="ml-2">SELL {trade.sell ?? '—'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  );
}

function VariantC({ featured }: { featured: HeroProfileData }) {
  return (
    <CardShell featured={featured} label="VARIANT C / BANNER POSTER">
      <div className="flex h-full flex-col justify-between gap-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="space-y-4">
            <div className="text-[11px] font-mono tracking-[6px] text-[rgba(255,255,255,0.42)]">FEATURED TRADER</div>
            <Identity featured={featured} />
          </div>
          <div className="grid gap-3">
            <StatBlock label="TOTAL PNL" value={featured.pnl} valueTone={tone(featured.pnlValue)} />
            <StatBlock label="WIN RATE" value={featured.winRate} />
            <StatBlock label="TRADES" value={featured.trades} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div
            className="px-4 py-4"
            style={{
              borderRadius: '6px',
              background: 'rgba(7,10,16,0.76)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="text-[10px] font-mono tracking-[3px] text-[rgba(255,255,255,0.42)]">TRADE HISTORY</div>
            <div className="mt-4">
              <CalendarStrip featured={featured} />
            </div>
          </div>

          <div className="space-y-3">
            {featured.topTrades.slice(0, 2).map((trade) => (
              <TradeChip key={trade.id} trade={trade} />
            ))}
          </div>
        </div>
      </div>
    </CardShell>
  );
}

export function HeroProfileVariants({ profiles }: { profiles: HeroProfileData[] }) {
  const featured = profiles[0];

  if (!featured) {
    return (
      <div className="min-h-screen bg-[#050508] px-6 py-12 text-white">
        <div className="mx-auto max-w-5xl text-center text-[14px] font-mono text-[rgba(255,255,255,0.62)]">
          No featured trader data available.
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050508] px-6 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-2">
          <div className="text-[12px] font-mono tracking-[4px] text-[rgba(0,212,255,0.75)]">LANDING HERO / PROFILE CARD DIRECTIONS</div>
          <h1 className="text-[34px] font-black tracking-[-0.05em] text-white sm:text-[48px]">Trader Hero Mockups</h1>
          <p className="max-w-3xl text-[14px] text-[rgba(255,255,255,0.62)]">
            Real featured trader data, real banner background, and darkened critical info zones. Compare the structure, not the copy.
          </p>
        </div>

        <VariantA featured={featured} />
        <VariantB featured={featured} />
        <VariantC featured={featured} />
      </div>
    </main>
  );
}
