# TRENCHER CUP — PROJECT DOCUMENTATION

## OVERVIEW

Trencher Cup is a live, time-bound trading tournament built on top of the Web3Me platform. It uses real on-chain Solana data from Helius to run competitive trading tournaments with real prize pools.

**Production URL:** https://trecher-id.vercel.app

## SEASON 1 — LIVE NOW

| Phase | Dates | Duration |
|-------|-------|----------|
| **Qualification** | Apr 13 – May 10, 2026 | 4 weeks |
| **Group Stage** | May 13 – 15, 2026 | 48 hours |
| **Round of 16** | May 17 – 19, 2026 | 48 hours |
| **Quarter-Finals** | May 21 – 23, 2026 | 48 hours |
| **Semi-Finals** | May 25 – 27, 2026 | 48 hours |
| **Final** | May 29 – Jun 1, 2026 | 72 hours |

**Prize Pool:** $10,000 WEB3ME tokens
**Status:** Qualifying (opens April 13)

## ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────┐
│                        WEB3ME PLATFORM                        │
├──────────────────────────────────────────────────────────────┤
│  Frontend (Next.js 16)    │  Database (Railway PostgreSQL)    │
│  - Landing page           │  - Users (117 seeded)             │
│  - Leaderboard            │  - Wallets (116 linked)           │
│  - Profile pages          │  - WalletTrade (23,937 records)   │
│  - Dashboard              │  - WalletTradeEvent (63,640)      │
│  - Trencher Cup bracket   │  - UserRanking (485 records)      │
│  - Live match tracker     │  - CupSeason (Season 1 active)    │
├───────────────────────────┤  - CupParticipant                 │
│  Auth: Privy + Twitter    │  - CupGroup                       │
│  Data: Helius API         │  - CupMatch                       │
│  Cache: Redis (Railway)   │  - CupPrizeDistribution           │
│  Deploy: Vercel           │                                   │
└───────────────────────────┴──────────────────────────────────┘
```

## DATABASE SCHEMA

### Existing Tables
| Table | Purpose |
|-------|---------|
| `User` | Trader profiles (username, displayName, Twitter, Privy auth, cupChampionSeasons) |
| `Wallet` | Linked Solana wallets with aggregated stats |
| `WalletTrade` | Per-token PnL aggregates (source of truth for rankings) |
| `WalletTradeEvent` | Individual on-chain swap events from Helius |
| `UserRanking` | Materialized rankings per period (1d, 3d, 7d, 14d, all) |
| `PinnedTrade` | User-curated showcase trades |
| `TokenDeployment` | Token launches on pump.fun |
| `Referral` | Referral tracking between users |
| `Link` | Social/outbound links |
| `WalletSyncAudit` | Audit trail for wallet sync operations |

### Cup Tournament Tables
| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `CupSeason` | Tournament seasons with time windows | status, prizePoolUsd, championUserId, all round start/end dates |
| `CupParticipant` | Trader participation in a season | seed, group, qualificationPnlUsd, currentRound, eliminatedAt |
| `CupGroup` | 8 groups of 4 traders each | participantIds (string[4]), name (A-H) |
| `CupMatch` | Head-to-head matches with live PnL | participant1Id, participant2Id, live PnL, winnerId, windowStart/End |
| `CupPrizeDistribution` | Prize pool allocation | rank, title, prizeUsd, percentage |

## CUP ENGINE (`src/lib/cup-engine.ts`)

### Core Functions
```
createSeason(input)         → Create new tournament season
getSeason(slug)             → Retrieve season with all relations
getCurrentSeason()          → Get most recent active season

getQualifiers(start, end, limit=32) → Top N traders by PnL in window
populateSeason(seasonId, start, end) → Create 32 participant records
drawGroups(seasonId)        → Serpentine seeding into 8 groups of 4
createKnockoutRound(...)    → Create R16/QF/SF/Final matches
getParticipantPnlInWindow(...) → Get trader's PnL within match window
refreshLiveMatches(seasonId)   → Update all live matches with current PnL
advanceRound(seasonId, nextRound) → Resolve matches, create next round
setupPrizeDistribution(...) → Create prize allocation records
```

### Tournament Lifecycle
```
draft → qualifying → groups → r16 → qf → sf → final → completed
```

### Match Resolution Logic
```
1. Primary: Higher realized PnL during match window wins
2. Tiebreaker 1: Higher trade count during window
3. Tiebreaker 2: Higher seed (lower rank number)
```

## LIVE PnL TRACKER (NO CRON DEPENDENCY)

During active matches, the system polls Helius directly every 30 seconds:

```
Frontend polls /api/cup/live-matches every 30s
  → Server queries Helius for each participant's wallets
  → Parses recent transactions for PnL in match window
  → Returns live battle data: trader1 +$X vs trader2 +$Y
  → Shows leader indicator, margin, recent transaction count
  → Auto-hides when no matches are active
```

**This is the game changer.** No cron jobs needed during the tournament. Real-time Helius polling drives everything.

## API ROUTES

| Route | Method | Purpose |
|-------|--------|---------|
| `GET /api/leaderboard` | GET | Ranked traders by period |
| `GET /api/cup/schedule` | GET | Season dates from DB (fallback: env vars) |
| `GET /api/cup/register` | GET | Check registration status + eligibility |
| `POST /api/cup/register` | POST | Register for Season 1 |
| `GET /api/cup/live-matches` | GET | Real-time match PnL from Helius |

## FRONTEND COMPONENTS

### Tournament UI (`src/components/tournament/`)
| File | Purpose |
|------|---------|
| `tournament-bracket.tsx` | Main bracket with scroll-synced horizontal layout |
| `knockout-bracket.tsx` | Standalone knockout bracket (R16 → Final) |
| `group-stage.tsx` | Standalone group stage grid |
| `group-card.tsx` | Individual group card (4 traders, top 2 highlighted) |
| `matchup-card.tsx` | Head-to-head matchup with winner/loser styling |
| `bracket-connector.tsx` | SVG connector lines between rounds |
| `bracket-utils.ts` | Core bracket logic (types, serpentine seeding, resolution) |
| `cup-hero-variants.tsx` | Hero/header design variants |
| `participate-button.tsx` | CTA routing to Privy login or dashboard |

### Cup Landing Page Components
| File | Purpose |
|------|---------|
| `cup-registration-button.tsx` | Eligibility check + register button |
| `live-match-tracker.tsx` | Live PnL battle display (auto-shows during tournament) |
| `champion-badge.tsx` | Champion crown + badge for winners |
| `share-card.tsx` | Social sharing (copy + share buttons) |

## DATA FLOW

### Qualification
1. Traders link wallets via Privy auth
2. Helius cron fetches on-chain transactions hourly
3. Trades parsed into WalletTrade + WalletTradeEvent records
4. UserRanking materialized views computed per period
5. Top 32 by realized PnL in qualification window qualify

### Tournament Execution (Auto-Driven)
1. **Qualification Window** (4 weeks) — traders accumulate real on-chain PnL
2. **Group Stage** (48 hours) — 8 groups compete, top 2 advance
3. **Round of 16** (48 hours) — head-to-head, 8 winners advance
4. **Quarter-Finals** (48 hours) — 4 winners advance
5. **Semi-Finals** (48 hours) — 2 winners advance
6. **Final** (72 hours) — champion crowned

### Live PnL During Matches
- System queries Helius for each trader's wallets during match window
- Calculates realized PnL ONLY for trades within the match time window
- Updates CupMatch records live (participant1PnlUsd, participant2PnlUsd)
- Frontend polls every 30s for live PnL battle display

### Slack Notifications
- Fires on round transitions: groups_start, r16_start, qf_start, sf_start, final_start, champion_crowned
- Integrated into `advanceRound()` function
- Uses `SLACK_WEBHOOK_URL` env var (set in Vercel dashboard)

## LANDING PAGE STRUCTURE

1. **Hero** — Featured traders (top 3 positive PnL), shader card carousel
2. **Leaderboard** — Full table view (separate section)
3. **Trencher Cup** — Countdown timers, registration, live matches, bracket
4. **Journey** — How it works + reward pool
5. **Referrals** — Referral program
6. **Gallery** — Dome gallery of trader avatars

## TESTS

### E2E Test Suite (`tests/cup-engine.test.ts`)
```
17 tests — 100% passing

Season Creation (3)        → create, retrieve, get current
Qualification Engine (3)   → top 32 by PnL, time windows, multi-wallet
Season Population (1)      → 32 participant records
Group Draw (2)             → 8x4 serpentine seeding, participant updates
Knockout Rounds (1)        → R16 match creation
Live PnL Tracking (1)      → zero PnL for no trades
Round Advancement (1)      → status transitions + match creation
Prize Distribution (1)     → correct amounts, total = pool
Edge Cases (3)             → duplicate slug, zero prize pool, insufficient participants
```

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

## DEPLOYMENT

### Vercel Production
- **URL:** https://trecher-id.vercel.app
- **Branch:** main (auto-deploys on push)
- **Cron:** `/api/cron/refresh-stats` runs every hour (`0 * * * *`)
- **Database:** Railway PostgreSQL (hopper.proxy.rlwy.net:10087)
- **Redis:** Railway Redis (crossover.proxy.rlwy.net:34102)

### Current Data Stats (Cleaned)
```
Users: 117 (real seeded accounts from Axiom + devprint)
Wallets: 116 (real Solana addresses)
Trade Events: 63,640 (real Helius on-chain data)
Aggregated Trades: 23,937
User Rankings: 485
Cup Seasons: 1 (Season 1, qualifying)
Cup Participants: 0 (awaiting real registrations)
Test Data: DELETED (0 test users remain)
```

### Top 5 Traders (Real Data)
| # | Trader | PnL | Trades |
|---|--------|-----|--------|
| 1 | deployer_02 | +$134,925 | 712 |
| 2 | jackduval | +$24,308 | 98 |
| 3 | deployer_16 | +$15,760 | 84 |
| 4 | deployer_10 | +$14,471 | 864 |
| 5 | BulgarianDegen | +$6,421 | 290 |

## PRIZE DISTRIBUTION

| Rank | Title | % of Pool | Amount |
|------|-------|-----------|--------|
| 1 | Champion | 40% | $4,000 |
| 2 | Runner-up | 25% | $2,500 |
| 3-4 | Semi-finalists | 10% each | $1,000 each |
| 5-8 | Quarter-finalists | 3.75% each | $375 each |

## REGISTRATION FLOW

1. User signs in via Privy (Twitter/X auth)
2. Frontend calls `GET /api/cup/register`
3. API checks:
   - Signed in? → Yes
   - Has linked wallets? → Yes
   - >= 10 trades in qualification window? → Checks
   - Season in 'qualifying' status? → Yes
4. If eligible → shows "Register for Season 1" button
5. User clicks → `POST /api/cup/register` → creates CupParticipant record
6. If not eligible → shows progress: "X / 10 trades"

## ENVIRONMENT

### Required Variables
```
DATABASE_URL        → PostgreSQL connection string
REDIS_URL           → Redis connection string
HELIUS_API_KEY      → Helius API key for on-chain data
CRON_SECRET         → Secret for cron endpoint auth
JWT_SECRET          → JWT signing secret
NEXT_PUBLIC_PRIVY_APP_ID → Privy app ID
PRIVY_APP_SECRET    → Privy app secret
```

### Optional Variables
```
CRON_WALLET_CONCURRENCY   → Parallel wallet sync (default: 2)
CRON_USER_CONCURRENCY     → Parallel user processing (default: 4)
SLACK_WEBHOOK_URL         → Slack notifications for cup events
```

## KEY DECISIONS

### Why No Cron Dependency for Live Matches?
Cron jobs are unreliable during critical tournament phases. The live match tracker polls Helius directly every 30s, so the tournament runs independently. Cron still runs hourly for general wallet sync, but the tournament doesn't depend on it.

### Why Simplified Relations?
CupGroup and CupMatch store participant IDs as plain strings/arrays instead of FK relations to CupParticipant. This avoids Prisma relation complexity with multiple back-references. Trade-off: manual joins needed in queries.

### Why Fallback SOL Price?
CoinGecko API rate limits (429 errors) during tests and high-traffic periods. Fallback to $150 SOL price ensures the system doesn't break when price API is unavailable.

### Why Pre-seeded Users?
The 117 user accounts were pre-created with real Solana wallet addresses from the Axiom leaderboard and devprint. This allows the tournament to have real on-chain data from day one, rather than waiting for organic user signups.

## REFERENCES

- **Repo:** /Users/henry/Documents/Gazillion-dollars/Ponzinomics/use-case-apps/trecher-id
- **Database:** Railway PostgreSQL
- **Deploy:** Vercel (henry6262s-projects/trecher-id)
- **Related:** devprint project at /Users/henry/Documents/Gazillion-dollars/Ponzinomics/use-case-apps/devprint
