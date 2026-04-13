'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { GlassCard } from './glass-card';
import { AvatarImage } from './avatar-image';
import { getPublicAvatarUrl } from '@/lib/images';

// ─── Types ───────────────────────────────────────────────────

export type ArenaCategory = 'trader' | 'deployer' | 'dual';

interface ArenaTrader {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  pnlSol: number;
  winRate: number;
  trades: number;
  category: ArenaCategory;
  // Deployment data
  devPnlUsd?: number | null;
  devPnlSol?: number | null;
  deployCount?: number;
  migratedCount?: number;
  graduationRate?: number;
  tokens7d?: number;
  bestToken?: string | null;
  bestTokenPnl?: number | null;
  bestMcapAthUsd?: number | null;
  deployments?: {
    tokenSymbol: string;
    tokenName: string | null;
    tokenImageUrl: string | null;
    platform: string;
    status: string;
    mcapAthUsd: number | null;
    devPnlSol: number | null;
    devPnlUsd: number | null;
    deployedAt: string;
  }[];
}

// ─── Helpers ─────────────────────────────────────────────────

function formatDeployPnl(usd: number | null | undefined): string {
  if (usd == null) return '';
  const sign = usd >= 0 ? '+' : '';
  const abs = Math.abs(usd);
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}K`;
  return `${sign}$${Math.round(usd)}`;
}

function categoryBadge(cat: ArenaCategory) {
  switch (cat) {
    case 'dual':
      return {
        label: 'DUAL',
        color: '#FFD700',
        bg: 'rgba(255,215,0,0.12)',
        border: 'rgba(255,215,0,0.3)',
      };
    case 'deployer':
      return {
        label: 'DEPLOYER',
        color: '#8B5CF6',
        bg: 'rgba(139,92,246,0.12)',
        border: 'rgba(139,92,246,0.3)',
      };
    case 'trader':
    default:
      return {
        label: 'TRADER',
        color: '#00D4FF',
        bg: 'rgba(0,212,255,0.12)',
        border: 'rgba(0,212,255,0.3)',
      };
  }
}

// ─── Main ────────────────────────────────────────────────────

export function ArenaSection() {
  const [traders, setTraders] = useState<ArenaTrader[]>([]);

  // Fetch data — combined pool of traders + deployers
  useEffect(() => {
    let cancelled = false;

    async function load() {
      // 1. Fetch both lists in parallel
      const [traderRes, deployerRes] = await Promise.all([
        fetch('/api/leaderboard?period=7d&limit=16'),
        fetch('/api/leaderboard/deployers?limit=16'),
      ]);
      const traderData = await traderRes.json();
      const deployerData = await deployerRes.json();

      if (!Array.isArray(traderData) || traderData.length < 4) return;
      if (!Array.isArray(deployerData) || deployerData.length < 4) return;

      const deployerUsernames = new Set(deployerData.map((d: { username: string }) => d.username.toLowerCase()));

      // Build a merged pool: DUALs first, then pure traders, then pure deployers
      const pool: {
        username: string;
        displayName: string;
        avatarUrl: string | null;
        pnlSol: number;
        winRate: number;
        trades: number;
        category: ArenaCategory;
        devPnlUsd: number | null;
        devPnlSol: number | null;
        deployCount: number;
        migratedCount: number;
        graduationRate: number;
        tokens7d: number;
      }[] = [];

      // First: DUALs (in both lists)
      const added = new Set<string>();
      for (const t of traderData) {
        if (deployerUsernames.has(t.username.toLowerCase())) {
          const dep = deployerData.find((d: { username: string }) => d.username.toLowerCase() === t.username.toLowerCase());
          pool.push({
            username: t.username,
            displayName: t.displayName,
            avatarUrl: t.avatarUrl,
            pnlSol: t.pnlSol,
            winRate: t.winRate,
            trades: t.trades,
            category: 'dual',
            devPnlUsd: dep?.totalDevPnlUsd ?? null,
            devPnlSol: dep?.totalDevPnlSol ?? null,
            deployCount: dep?.deployCount ?? 0,
            migratedCount: dep?.migratedCount ?? 0,
            graduationRate: dep?.graduationRate ?? 0,
            tokens7d: dep?.tokens7d ?? 0,
          });
          added.add(t.username.toLowerCase());
        }
      }

      // Then: pure traders (top ones not in deployer list)
      for (const t of traderData) {
        if (!added.has(t.username.toLowerCase())) {
          pool.push({
            username: t.username,
            displayName: t.displayName,
            avatarUrl: t.avatarUrl,
            pnlSol: t.pnlSol,
            winRate: t.winRate,
            trades: t.trades,
            category: 'trader',
            devPnlUsd: null,
            devPnlSol: null,
            deployCount: 0,
            migratedCount: 0,
            graduationRate: 0,
            tokens7d: 0,
          });
          added.add(t.username.toLowerCase());
        }
      }

      // Then: pure deployers to fill the rest
      for (const d of deployerData) {
        if (!added.has(d.username.toLowerCase()) && pool.length < 16) {
          pool.push({
            username: d.username,
            displayName: d.displayName,
            avatarUrl: d.avatarUrl,
            pnlSol: 0,
            winRate: 0,
            trades: 0,
            category: 'deployer',
            devPnlUsd: d.totalDevPnlUsd ?? 0,
            devPnlSol: d.totalDevPnlSol ?? 0,
            deployCount: d.deployCount ?? 0,
            migratedCount: d.migratedCount ?? 0,
            graduationRate: d.graduationRate ?? 0,
            tokens7d: d.tokens7d ?? 0,
          });
          added.add(d.username.toLowerCase());
        }
      }

      // Take top 8
      const top8 = pool.slice(0, 8);

      // 2. For each person, fetch individual deployment records (for deployers + duals)
      const withDeps = await Promise.all(
        top8.map(async (person) => {
          const hasDeploys = person.category === 'deployer' || person.category === 'dual';
          if (!hasDeploys) {
            return {
              ...person,
              bestToken: null,
              bestTokenPnl: null,
              migratedCount: 0,
              bestMcapAthUsd: null,
              deployments: [] as NonNullable<ArenaTrader['deployments']>,
            };
          }

          try {
            const res = await fetch(`/api/deployments?username=${encodeURIComponent(person.username)}`);
            if (!res.ok) {
              return {
                ...person,
                bestToken: null,
                bestTokenPnl: null,
                migratedCount: 0,
                bestMcapAthUsd: null,
                deployments: [] as NonNullable<ArenaTrader['deployments']>,
              };
            }
            const json = await res.json();
            const rawDeps: NonNullable<ArenaTrader['deployments']> = Array.isArray(json.deployments) ? json.deployments : [];
            const deps = rawDeps
              .sort((a: { devPnlUsd: number | null }, b: { devPnlUsd: number | null }) => (b.devPnlUsd ?? 0) - (a.devPnlUsd ?? 0))
              .slice(0, 4);
            const bestToken = deps.length > 0 ? deps[0].tokenSymbol : null;
            const bestTokenPnl = deps.length > 0 ? deps[0].devPnlSol : null;
            const migratedCount = deps.filter((d) => d.status === 'migrated').length;
            const bestMcapAthUsd = deps.length > 0
              ? deps.reduce((max, d) => Math.max(max, d.mcapAthUsd ?? 0), 0) || null
              : null;

            return {
              ...person,
              bestToken,
              bestTokenPnl,
              migratedCount,
              bestMcapAthUsd,
              deployments: deps,
            };
          } catch {
            return {
              ...person,
              bestToken: null,
              bestTokenPnl: null,
              migratedCount: 0,
              bestMcapAthUsd: null,
              deployments: [] as NonNullable<ArenaTrader['deployments']>,
            };
          }
        }),
      );

      if (!cancelled) setTraders(withDeps as ArenaTrader[]);
    }

    load().catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (traders.length < 8) return null;

  return (
    <>
      <div className="mx-auto max-w-[780px] px-6 sm:px-12 lg:px-16">
        <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.15), transparent)' }} />
      </div>

      <section className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12 py-16">
        {/* Header — trophy + title */}
        <div className="flex items-center justify-center gap-6 sm:gap-10 lg:gap-14 mb-8">
          <div
            className="w-[100px] h-[100px] sm:w-[140px] sm:h-[140px] lg:w-[160px] lg:h-[160px] relative flex-shrink-0"
            style={{
              filter: 'drop-shadow(0 0 24px rgba(0,212,255,0.25)) drop-shadow(0 4px 24px rgba(0,212,255,0.1))',
            }}
          >
            <Image src="/trencher-cup.png" alt="Trencher Cup Trophy" fill className="object-contain" priority />
          </div>
          <div className="text-left min-w-0">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-2">
              The Trencher <span style={{ color: '#00D4FF' }}>Cup</span>
            </h2>
            <p className="text-[12px] sm:text-[13px] text-[var(--trench-text-muted)]">32 traders. One champion. Real money on the line.</p>
          </div>
        </div>

        <GlassCard cut={14} bg="rgba(8,12,18,0.55)">
        <div className="relative overflow-hidden px-4 sm:px-6 py-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 70%)' }} />

        {/* Participant grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-6">
          {traders.map((t, i) => (
            <Link
              key={t.username}
              href={`/${t.username}`}
              className="cut-sm block p-3 transition-all hover:border-[rgba(0,212,255,0.25)] hover:bg-[rgba(0,212,255,0.06)]"
              style={{
                background: 'rgba(8,12,22,0.6)',
                border: '1px solid rgba(0,212,255,0.08)',
                textDecoration: 'none',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono font-bold text-[var(--trench-text-muted)] w-5 text-center flex-shrink-0">
                  {i + 1}
                </span>
                <span
                  className="text-[6px] font-bold tracking-[1px] px-1.5 py-0.5 rounded-sm flex-shrink-0"
                  style={{
                    color: categoryBadge(t.category).color,
                    background: categoryBadge(t.category).bg,
                  }}
                >
                  {categoryBadge(t.category).label}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0"
                  style={{ border: '1.5px solid rgba(0,212,255,0.15)' }}
                >
                  <AvatarImage
                    src={getPublicAvatarUrl(t.username, t.avatarUrl)}
                    alt={t.username}
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-white truncate">@{t.username}</div>
                  {t.category === 'trader' ? (
                    <div className="text-[9px] text-[var(--trench-text-muted)]">{t.trades} trades</div>
                  ) : (
                    <div className="text-[9px] text-[var(--trench-text-muted)]">{t.migratedCount ?? 0} migrated · {t.deployCount ?? 0} total</div>
                  )}
                </div>
              </div>
              {/* Stats strip */}
              {t.category !== 'trader' && t.deployments && t.deployments.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {t.deployments.slice(0, 2).map((dep) => {
                    const pnlPositive = (dep.devPnlUsd ?? 0) >= 0;
                    return (
                      <div
                        key={dep.tokenSymbol + dep.deployedAt}
                        className="flex items-center gap-1.5 px-1.5 py-1"
                        style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '3px' }}
                      >
                        <div className="w-5 h-5 rounded-full flex-shrink-0 overflow-hidden" style={{ background: dep.tokenImageUrl ? '#111' : 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
                          {dep.tokenImageUrl ? (
                            <Image src={dep.tokenImageUrl} alt={dep.tokenSymbol} width={20} height={20} className="w-full h-full object-cover" unoptimized />
                          ) : (
                            <span className="text-[6px] font-bold text-white flex items-center justify-center h-full">{dep.tokenSymbol.slice(0, 2)}</span>
                          )}
                        </div>
                        <span className="text-[9px] font-bold text-[var(--trench-text)] truncate flex-1">${dep.tokenSymbol}</span>
                        <span className={`text-[8px] font-mono font-bold flex-shrink-0 ${pnlPositive ? 'text-[var(--trench-green)]' : 'text-[var(--trench-red)]'}`}>
                          {formatDeployPnl(dep.devPnlUsd)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : t.category !== 'trader' ? (
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="font-bold text-white">{t.migratedCount ?? 0} migrated</span>
                  <span className="text-[var(--trench-text-muted)]">{Math.round(t.graduationRate ?? 0)}% GR</span>
                  <span className="text-[var(--trench-text-muted)]">{t.tokens7d ?? 0} in 7d</span>
                </div>
              ) : t.pnlSol !== 0 ? (
                <div className="text-[10px] font-mono font-bold text-[var(--trench-green)]">
                  +{Math.round(t.pnlSol)} SOL
                </div>
              ) : null}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-6">
          <Link href="/leaderboard" className="inline-block px-6 py-2.5 text-[10px] font-bold tracking-[2px] text-black cut-xs" style={{ background: '#00D4FF', textDecoration: 'none' }}>ENTER THE ARENA →</Link>
        </div>
        </div>
        </GlassCard>
      </section>
    </>
  );
}
