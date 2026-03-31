import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const alt = 'Trench ID Profile';
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
}

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      wallets: true,
      pinnedTrades: { orderBy: { order: 'asc' }, take: 3 },
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
          }}
        >
          Not Found
        </div>
      ),
      { ...size },
    );
  }

  const wallets: OGWallet[] = user.wallets;
  const pinnedTrades: OGPinnedTrade[] = user.pinnedTrades;

  let totalPnl = 0;
  let totalWinRate = 0;
  let winRateCount = 0;
  let totalTrades = 0;
  for (const w of wallets) {
    totalPnl += w.totalPnlUsd ?? 0;
    totalTrades += w.totalTrades ?? 0;
    if (w.winRate != null) {
      totalWinRate += w.winRate;
      winRateCount++;
    }
  }
  const winRate = winRateCount > 0 ? totalWinRate / winRateCount : 0;
  const pnlStr =
    totalPnl >= 1000 ? `+$${(totalPnl / 1000).toFixed(1)}K` : `+$${totalPnl.toFixed(0)}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#050508',
          padding: 60,
          fontFamily: 'monospace',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, transparent, #00D4FF, transparent)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 40 }}>
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: '#00D4FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              fontWeight: 700,
              color: '#000',
              border: '3px solid rgba(0,212,255,0.3)',
            }}
          >
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#e4e4e7' }}>@{user.username}</div>
            {user.bio && (
              <div style={{ fontSize: 18, color: '#71717a', marginTop: 4 }}>{user.bio}</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 60, marginBottom: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 42, fontWeight: 700, color: '#22c55e' }}>{pnlStr}</div>
            <div style={{ fontSize: 14, color: '#71717a', letterSpacing: 2 }}>TOTAL PnL</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 42, fontWeight: 700, color: '#00D4FF' }}>
              {winRate.toFixed(0)}%
            </div>
            <div style={{ fontSize: 14, color: '#71717a', letterSpacing: 2 }}>WIN RATE</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 42, fontWeight: 700, color: '#e4e4e7' }}>{totalTrades}</div>
            <div style={{ fontSize: 14, color: '#71717a', letterSpacing: 2 }}>TRADES</div>
          </div>
        </div>

        {pinnedTrades.length > 0 && (
          <div style={{ display: 'flex', gap: 20 }}>
            {pinnedTrades.map((t: OGPinnedTrade) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(0,212,255,0.12)',
                  padding: '12px 20px',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: t.totalPnlPercent >= 0 ? '#22c55e' : '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#000',
                  }}
                >
                  {t.tokenSymbol.slice(0, 3)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#e4e4e7' }}>
                    ${t.tokenSymbol}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: t.totalPnlPercent >= 0 ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {t.totalPnlPercent >= 0 ? '+' : ''}
                    {t.totalPnlPercent.toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            bottom: 30,
            right: 60,
            fontSize: 16,
            color: 'rgba(0,212,255,0.4)',
            letterSpacing: 4,
          }}
        >
          TRENCH ID
        </div>
      </div>
    ),
    { ...size },
  );
}
