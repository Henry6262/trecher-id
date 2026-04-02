import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';
import { formatPnl } from '@/lib/utils';

export const runtime = 'nodejs';
export const alt = 'Trench ID Share Card';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface OGWallet {
  totalPnlUsd: number | null;
  winRate: number | null;
  totalTrades: number | null;
}

interface OGPinnedTrade {
  id: string;
  tokenSymbol: string;
  totalPnlPercent: number;
  totalPnlSol: number;
}

export default async function Image({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  // Load Inter font from Google Fonts with fallback
  let fontData: ArrayBuffer | undefined;
  try {
    fontData = await fetch(
      'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
    ).then((r) => r.arrayBuffer());
  } catch {
    // font fetch failed — ImageResponse will use system font
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      wallets: true,
      pinnedTrades: { orderBy: { totalPnlSol: 'desc' }, take: 3 },
    },
  });

  if (!user) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            background: '#050508',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#e4e4e7',
            fontSize: 48,
            fontFamily: 'Inter',
          }}
        >
          Not Found
        </div>
      ),
      { ...size, fonts: fontData ? [{ name: 'Inter', data: fontData, weight: 400 }] : [] },
    );
  }

  const wallets: OGWallet[] = user.wallets;
  const pinnedTrades: OGPinnedTrade[] = user.pinnedTrades;

  // Aggregate stats across all wallets
  let totalPnlUsd = 0;
  let totalWinRate = 0;
  let winRateCount = 0;
  let totalTrades = 0;
  for (const w of wallets) {
    totalPnlUsd += w.totalPnlUsd ?? 0;
    totalTrades += w.totalTrades ?? 0;
    if (w.winRate != null) {
      totalWinRate += w.winRate;
      winRateCount++;
    }
  }
  const winRate = winRateCount > 0 ? totalWinRate / winRateCount : 0;
  const pnlStr = formatPnl(totalPnlUsd);

  const CYAN = '#00D4FF';
  const BG = '#050508';
  const TEXT = '#e4e4e7';
  const MUTED = '#71717a';

  // Avatar: use URL if available, otherwise cyan circle with initial
  const initial = (user.displayName ?? user.username).charAt(0).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: BG,
          padding: '52px 64px',
          fontFamily: 'Inter',
          position: 'relative',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, transparent, ${CYAN}, transparent)`,
          }}
        />

        {/* Header row: avatar + username/display + WEB3ME logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 44,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* Avatar */}
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                width={80}
                height={80}
                style={{
                  borderRadius: '50%',
                  border: `2px solid rgba(0,212,255,0.3)`,
                  objectFit: 'cover',
                }}
                alt=""
              />
            ) : (
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: CYAN,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                  fontWeight: 700,
                  color: '#000',
                  border: `2px solid rgba(0,212,255,0.3)`,
                }}
              >
                {initial}
              </div>
            )}

            {/* Username + display name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: TEXT }}>
                @{user.username}
              </div>
              {user.displayName && user.displayName !== user.username && (
                <div style={{ fontSize: 16, color: MUTED }}>
                  {user.displayName}
                </div>
              )}
            </div>
          </div>

          {/* WEB3ME logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: CYAN,
                letterSpacing: 3,
              }}
            >
              WEB3ME
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 40 }}>
          {/* Total PnL */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              background: 'rgba(0,212,255,0.08)',
              border: '1px solid rgba(0,212,255,0.2)',
              padding: '20px 24px',
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: MUTED,
                letterSpacing: 2,
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              TOTAL PNL
            </div>
            <div
              style={{
                fontSize: 38,
                fontWeight: 700,
                color: totalPnlUsd >= 0 ? '#22c55e' : '#ef4444',
              }}
            >
              {pnlStr}
            </div>
          </div>

          {/* Win Rate */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              background: 'rgba(0,212,255,0.08)',
              border: '1px solid rgba(0,212,255,0.2)',
              padding: '20px 24px',
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: MUTED,
                letterSpacing: 2,
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              WIN RATE
            </div>
            <div style={{ fontSize: 38, fontWeight: 700, color: CYAN }}>
              {winRate.toFixed(0)}%
            </div>
          </div>

          {/* Trades */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              background: 'rgba(0,212,255,0.08)',
              border: '1px solid rgba(0,212,255,0.2)',
              padding: '20px 24px',
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: MUTED,
                letterSpacing: 2,
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              TRADES
            </div>
            <div style={{ fontSize: 38, fontWeight: 700, color: TEXT }}>
              {totalTrades}
            </div>
          </div>
        </div>

        {/* Trade pills */}
        {pinnedTrades.length > 0 && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 40 }}>
            {pinnedTrades.map((t: OGPinnedTrade) => {
              const positive = t.totalPnlPercent >= 0;
              return (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: positive
                      ? 'rgba(34,197,94,0.15)'
                      : 'rgba(239,68,68,0.15)',
                    border: `1px solid ${positive ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    padding: '10px 20px',
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>
                    {t.tokenSymbol}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: positive ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {positive ? '+' : ''}
                    {t.totalPnlPercent.toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer: URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 36,
            left: 64,
            fontSize: 15,
            color: 'rgba(0,212,255,0.45)',
            letterSpacing: 2,
          }}
        >
          web3me.xyz
        </div>

        {/* Bottom accent bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${CYAN}, transparent)`,
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: fontData ? [{ name: 'Inter', data: fontData, weight: 400 }] : [],
    },
  );
}
