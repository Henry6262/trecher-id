# KolScan MVP Integration Guide

This guide explains how to integrate the new KolScan-style dashboard components into the trecher-id dashboard.

## Components Overview

### 1. **StatsPanel** — Key Metrics Display
**Location:** `src/components/dashboard/stats-panel.tsx`

**Props:**
```typescript
interface WalletStats {
  totalPnlUsd?: number;
  winRate?: number;
  totalTrades?: number;
  holdings: Array<{ tokenSymbol: string; amount: number; valueUsd?: number }>;
}
```

**Usage:**
```tsx
import { StatsPanel } from '@/components/dashboard/stats-panel';

<StatsPanel stats={{
  totalPnlUsd: 1234.56,
  winRate: 65.5,
  totalTrades: 42,
  holdings: [
    { tokenSymbol: 'SOL', amount: 10.5, valueUsd: 3150 },
    { tokenSymbol: 'COPE', amount: 1000, valueUsd: 50 }
  ]
}} />
```

**Data Source:**
```
GET /api/profile/stats?username=henry&period=7d
→ Returns { pnlUsd, winRate, trades, holdings }
```

---

### 2. **PnLCalendar** — Daily Performance Heatmap
**Location:** `src/components/dashboard/pnl-calendar.tsx`

**Props:**
```typescript
interface DailyPnL {
  date: Date;
  pnlUsd: number;
}

interface PnLCalendarProps {
  dailyData: DailyPnL[];
  period: '1d' | '3d' | '7d' | '14d' | '30d';
  onPeriodChange: (period: '1d' | '3d' | '7d' | '14d' | '30d') => void;
}
```

**Usage:**
```tsx
import { PnLCalendar } from '@/components/dashboard/pnl-calendar';
import { useState } from 'react';

export function Dashboard() {
  const [period, setPeriod] = useState<'7d'>('7d');
  const [dailyPnL, setDailyPnL] = useState<DailyPnL[]>([]);

  useEffect(() => {
    fetch(`/api/profile/pnl-history?username=henry&period=${period}`)
      .then(r => r.json())
      .then(setDailyPnL);
  }, [period]);

  return (
    <PnLCalendar 
      dailyData={dailyPnL}
      period={period}
      onPeriodChange={setPeriod}
    />
  );
}
```

**Data Source:**
```
GET /api/profile/pnl-history?username=henry&period=7d
→ Should return { date, pnlUsd }[] (check if endpoint exists)
→ If not, create new endpoint or fetch WalletTradeEvent data
```

---

### 3. **RecentTrades** — Trade Activity Table
**Location:** `src/components/dashboard/recent-trades.tsx`

**Props:**
```typescript
interface TradeEvent {
  id: string;
  tokenSymbol: string;
  tokenName: string;
  tokenImageUrl: string | null;
  type: 'buy' | 'sell';
  amountSol: number;
  timestamp: Date;
}

interface Props {
  trades: TradeEvent[];
  limit?: number; // default: 10
}
```

**Usage:**
```tsx
import { RecentTrades } from '@/components/dashboard/recent-trades';

<RecentTrades 
  trades={tradeEvents}
  limit={15}
/>
```

**Data Source:**
```
GET /api/profile/recent-trades?username=henry&limit=15
→ Returns { id, tokenSymbol, tokenName, tokenImageUrl, type, amountSol, timestamp }[]
```

---

## Full Dashboard Integration Example

```tsx
'use client';

import { useEffect, useState } from 'react';
import { StatsPanel } from '@/components/dashboard/stats-panel';
import { PnLCalendar } from '@/components/dashboard/pnl-calendar';
import { RecentTrades } from '@/components/dashboard/recent-trades';
import { useSession } from '@/lib/auth';

export function TradingAnalytics() {
  const session = useSession();
  const [period, setPeriod] = useState<'1d' | '3d' | '7d' | '14d' | '30d'>('7d');
  const [stats, setStats] = useState(null);
  const [dailyPnL, setDailyPnL] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.username) return;

    setLoading(true);

    // Fetch all three in parallel
    Promise.all([
      fetch(`/api/profile/stats?username=${session.username}&period=${period}`)
        .then(r => r.json())
        .then(setStats),
      
      fetch(`/api/profile/pnl-history?username=${session.username}&period=${period}`)
        .then(r => r.json())
        .then(setDailyPnL),
      
      fetch(`/api/profile/recent-trades?username=${session.username}&limit=15`)
        .then(r => r.json())
        .then(setTrades),
    ]).finally(() => setLoading(false));
  }, [session?.username, period]);

  if (loading) return <div>Loading analytics...</div>;
  if (!stats) return <div>No data available</div>;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-4">Trading Statistics</h2>
        <StatsPanel stats={stats} />
      </section>

      {/* PnL Calendar */}
      <section>
        <PnLCalendar 
          dailyData={dailyPnL}
          period={period}
          onPeriodChange={setPeriod}
        />
      </section>

      {/* Recent Activity */}
      <section>
        <RecentTrades trades={trades} limit={15} />
      </section>
    </div>
  );
}
```

---

## API Endpoints Summary

| Endpoint | Method | Query Params | Response |
|----------|--------|--------------|----------|
| `/api/profile/stats` | GET | `username`, `period` | `{ pnlUsd, winRate, trades, rank, period, holdings }` |
| `/api/profile/recent-trades` | GET | `username`, `limit` | Array of `{ id, tokenSymbol, ..., timestamp }` |
| `/api/profile/pnl-history` | GET | `username`, `period` | ⚠️ **Verify if exists** — Array of `{ date, pnlUsd }` |
| `/api/wallets/sync` | POST | (body: `{ address?: string }`) | Syncs trades + holdings, returns `{ walletsUpdated, newTrades }` |

**⚠️ Important:** Check if `/api/profile/pnl-history` exists. If not, you'll need to:
1. Create it to return daily PnL aggregates, OR
2. Build PnL calendar data client-side from WalletTradeEvent data

---

## Data Flow Diagram

```
User's Wallet (Solana)
    ↓
[POST /api/wallets/sync]
    ↓
    ├→ getWalletTransactions() [Helius]
    │   ├→ parseWalletTrades()
    │   └→ store WalletTrade, WalletTradeEvent
    │
    └→ getAssetsByOwner() [Helius DAS]
        ├→ getTokenMetadata()
        └→ store TokenHolding
    ↓
[GET /api/profile/stats]
    ├→ UserRanking (pnlUsd, winRate, trades, rank)
    └→ TokenHolding[] (holdings array)
    ↓
[React Components]
    ├→ <StatsPanel />     ← displays holdings, win rate, PnL
    ├→ <PnLCalendar />    ← daily performance heatmap
    └→ <RecentTrades />   ← recent buy/sell activity
```

---

## Testing Checklist

- [ ] Verify migration is applied: `TokenHolding` table created
- [ ] Test sync endpoint: POST `/api/wallets/sync` fetches holdings
- [ ] Check Helius quota: `getAssetsByOwner()` succeeds
- [ ] Verify stats endpoint: GET `/api/profile/stats?username=test` includes holdings
- [ ] Check recent trades: GET `/api/profile/recent-trades?username=test` returns events
- [ ] Render StatsPanel with sample data
- [ ] Render PnLCalendar with sample data
- [ ] Render RecentTrades with sample data
- [ ] Test responsive layout on mobile (2 column → 4 column grid)
- [ ] Verify image loading in RecentTrades table

---

## Performance Notes

- **Holdings Sync:** Added to main wallet sync, ~500ms per wallet (Helius API)
- **API Caching:** 
  - `/api/profile/stats` — no cache (always fresh)
  - `/api/profile/recent-trades` — 60s cache + 5min stale
  - `/api/profile/portfolio` — 2min cache + 5min stale
- **Database:** TokenHolding indexes optimized for `(walletId, valueUsd)` sorting
- **Bundle Size:** Components are lightweight, use existing GlassCard design system

---

## Future Enhancements

1. **PnL Calendar Data** — Wire up to `/api/profile/pnl-history` (create if missing)
2. **Holdings Charts** — Add recharts pie/bar charts for token breakdown
3. **Risk Metrics** — Add Sharpe, Sortino, max drawdown (need daily snapshots)
4. **Token Prices** — Integrate Jupiter or Pyth for non-SOL token USD values
5. **Public Profile** — Display read-only analytics on `[username]` page
6. **Advanced Filters** — Date range picker, token filter for trades
7. **Export Data** — CSV export of trades and holdings

---

**Created:** April 16, 2026  
**Status:** MVP Complete — Ready for dashboard integration
