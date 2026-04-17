# trecher-id

**On-chain identity for Solana traders. Claim your profile, prove your edge.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://prisma.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

trecher-id indexes real on-chain Solana trade data from public wallet addresses and builds a leaderboard of actual trading performance. Traders claim their identity by connecting their Twitter account — linking their on-chain record to their public persona.

**This repo is open so you can verify exactly what happens when you connect your Twitter. No trust required — read the code.**

---

## Why Twitter Auth? (Read This First)

When you connect Twitter to claim your profile, here is **exactly** what happens:

### What we read from your Twitter account

| Data | Why |
|------|-----|
| Username (`@handle`) | To match you to your pre-indexed on-chain profile |
| Display name | Shown on your public profile card |
| Profile picture | Shown on your public profile card |
| Follower count | Used only to validate referrals (anti-bot gate) |

### What we do NOT do

- Post, like, follow, or DM anything on your behalf
- Store your Twitter password or OAuth tokens
- Sell or share your data with third parties
- Access your Twitter DMs or private information

### How it works technically

Twitter OAuth is handled entirely by **[Privy](https://privy.io)** — a third-party auth provider. We receive a verified identity token from Privy, not your raw Twitter credentials. We never touch your Twitter session directly.

The full auth flow is in one file: [`src/app/api/auth/login/route.ts`](src/app/api/auth/login/route.ts)

**Profile claiming:** if your Twitter username matches a profile pre-seeded from public on-chain data, connecting Twitter atomically links that profile to you (`isClaimed: true`). If no pre-seeded profile exists for your handle, a fresh one is created. Only you can claim your username — the database enforces a unique constraint on `twitterId`.

---

## Features

- **Leaderboard** — Real-time Solana PnL rankings (7d, 14d, 30d, all-time) with win rate and trade count
- **Trader profiles** — Public profile cards with pinned trades, PnL history chart, and social links
- **KolScan-style analytics** — Stats panel, daily PnL heatmap calendar, and recent trades feed
- **Trencher Cup** — 32-player knockout tournament seeded from leaderboard rankings
- **Token deployer tracking** — Tracks pump.fun token creators with graduation rate and ATH stats
- **Referral system** — Tiered referral boosts with follower-count validation
- **Profile customization** — Accent color, banner image, and outbound link stack

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 + React 19 + TypeScript |
| Database | PostgreSQL via Prisma 7 (Neon serverless adapter) |
| Auth | Privy (Twitter OAuth) + JWT session cookies |
| Solana data | Helius RPC + transaction indexer |
| Caching | Redis (ioredis) — optional, graceful degradation |
| Identity layer | Ponzinomics SDK (`@ponzinomics/sdk`) |
| UI | shadcn/ui + Tailwind CSS v4 + Radix UI |
| Animation | Three.js, Framer Motion, GSAP |
| Charts | lightweight-charts |
| Testing | Playwright (E2E) + Vitest (unit) |

---

## Integrations

### Ponzinomics SDK — `@ponzinomics/sdk`

> **Built by the same team.** Ponzinomics is a plug-and-play gamification SDK — drop it into any app to add identity, auth, and engagement primitives without building them from scratch. trecher-id is a live example of it in production.
>
> **Free API keys:** Sign up at the [Ponzinomics dashboard](https://ponzinomics.io/dashboard) to get your `PONZINOMICS_API_KEY` and `PONZINOMICS_PROJECT_ID` — no credit card required.

In trecher-id the SDK handles the identity and session layer:

**1. Auth token exchange** — after Privy OAuth completes, the Privy token is exchanged for a Ponzinomics session:
```ts
// src/app/api/auth/login/route.ts
const authResponse = await sdk.auth.login({ privyToken: token });
// → { accessToken, refreshToken }
```

**2. Session resolution** — every authenticated request resolves the user via:
```ts
// src/lib/auth.ts
const user = await client.auth.getMe();
// → { privyId, twitterHandle, displayName, avatar }
```

Tokens are stored as `httpOnly` cookies (`ponzinomics_token` 7d, `ponzinomics_refresh` 30d).

**Code:** [`src/lib/ponzinomics.ts`](src/lib/ponzinomics.ts) · [`src/lib/auth.ts`](src/lib/auth.ts)

---

### Helius — Solana RPC + Indexing

Helius powers all on-chain data. For each linked wallet:
- `getTransactions()` — full swap history, paginated via `lastSignature` cursor
- `getAssetBatch()` — resolves token metadata (symbol, name, image) per trade
- `getAssetsByOwner()` — current token holdings

Trades are parsed into `WalletTrade` aggregates (per-token PnL rollup) and `WalletTradeEvent` rows (individual buy/sell events with timestamps).

**Code:** [`src/lib/helius.ts`](src/lib/helius.ts)

---

### Privy — Web3 + Twitter OAuth

Privy manages the OAuth flow end-to-end. A server-side `PrivyClient` verifies tokens using `PRIVY_APP_ID` + `PRIVY_APP_SECRET` — raw Twitter credentials never leave Privy's infrastructure.

**Code:** [`src/lib/privy.ts`](src/lib/privy.ts)

---

### Dune Analytics — On-Chain Deployer Stats

The deployer leaderboard pulls from a Dune query that aggregates pump.fun token creation data: total tokens deployed, 7d/30d counts, graduation rate, and migration stats. Fork query `6183649` for your own deployment.

**Code:** [`src/lib/dune.ts`](src/lib/dune.ts)

---

### Redis — Caching Layer

Redis caches hot data to keep the leaderboard fast: token metadata (24h TTL), ticker feed (60s TTL), leaderboard snapshots. The app degrades gracefully if Redis is unavailable — falls back to uncached DB queries.

**Code:** [`src/lib/redis.ts`](src/lib/redis.ts)

---

## Architecture

```
Twitter OAuth (Privy)
        │
        ▼
  Claim Profile ─────────────────────────────────────┐
        │                                             │
        ▼                                             ▼
  Add Solana Wallets                    Ponzinomics SDK session
        │                               (auth.login → auth.getMe)
        ▼
  Helius indexes swaps
        │
        ▼
  WalletTrade aggregates  ◄── Cron: refresh-stats (hourly)
        │
        ▼
  UserRanking materialized  (rank, pnlUsd, winRate, trades per period)
        │
        ├──► Leaderboard (7d / 14d / 30d / all-time)
        ├──► Public Profile (PnL chart, pinned trades, analytics)
        └──► Trencher Cup (seeded from top-32)
```

### Key Data Models

| Model | Purpose |
|-------|---------|
| `User` | Profile — username, Twitter/Privy link, claim status, accent color |
| `Wallet` | Linked Solana wallets with sync cursor (`lastSignature`) |
| `WalletTrade` | Per-token PnL aggregates (buySol, sellSol, pnlSol) |
| `WalletTradeEvent` | Individual buy/sell events with timestamps |
| `TokenHolding` | Current token balances per wallet |
| `UserRanking` | Materialized leaderboard positions per period |
| `TokenDeployment` | Tokens deployed by users (pump.fun) |
| `PinnedTrade` | User-selected highlight trades shown on profile |
| `CupSeason` / `CupMatch` | Trencher Cup tournament state |
| `Referral` | Referral relationships with follower validation |

Full schema: [`prisma/schema.prisma`](prisma/schema.prisma)

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL ([Neon](https://neon.tech) recommended — serverless-compatible)
- Redis (optional)
- Service accounts: [Privy](https://privy.io), [Helius](https://helius.dev), [Dune Analytics](https://dune.com)
- Ponzinomics SDK credentials — see [ponzinomics.io](https://ponzinomics.io)

### Setup

```bash
# 1. Clone and install
git clone https://github.com/your-org/trecher-id.git
cd trecher-id
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in all required values in .env.local

# 3. Set up the database
npx prisma generate
npx prisma migrate deploy

# 4. Run the dev server
npm run dev
# → http://localhost:3000
```

### Build for production

```bash
npm run build
npm start
```

### Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Set all env vars in the Vercel dashboard. Build command: `prisma generate && next build`

---

## Environment Variables

See [`.env.example`](.env.example) for the full annotated list.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXT_PUBLIC_PRIVY_APP_ID` | ✅ | Privy app ID (public) |
| `PRIVY_APP_SECRET` | ✅ | Privy app secret (server-only) |
| `HELIUS_API_KEY` | ✅ | Helius API key for Solana data |
| `PONZINOMICS_API_KEY` | ✅ | Ponzinomics SDK API key |
| `PONZINOMICS_PROJECT_ID` | ✅ | Your Ponzinomics project ID |
| `JWT_SECRET` | ✅ | Random 32+ char string for session signing |
| `CRON_SECRET` | ✅ | Secret for manually invoking cron jobs |
| `DUNE_API_KEY` | ✅ | Dune Analytics API key |
| `DUNE_DEPLOYER_QUERY_ID` | ✅ | Dune query ID (`6183649` or your fork) |
| `REDIS_URL` | Optional | Redis connection — app works without it |
| `SLACK_WEBHOOK_URL` | Optional | Cron job notifications |
| `MIN_REFERRAL_FOLLOWERS` | Optional | Min followers to validate a referral (default: 5) |

---

## Cron Jobs

Three background jobs keep data fresh. All require `Authorization: Bearer $CRON_SECRET` for manual invocation, or trigger automatically via Vercel Cron.

| Job | Route | What it does |
|-----|-------|-------------|
| Refresh Stats | `GET /api/cron/refresh-stats` | Syncs Helius wallet trades, recalculates PnL, materializes leaderboard |
| Refresh Deployers | `GET /api/cron/refresh-deployers` | Fetches top pump.fun deployers from Dune |
| Tournament Manager | `GET /api/cron/tournament-manager` | Advances Trencher Cup phases |

```bash
# Invoke manually
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-app.vercel.app/api/cron/refresh-stats
```

---

## Tests

```bash
# Unit tests (Vitest)
npm run test

# E2E tests (Playwright — requires running dev server)
npm run test:e2e
```

---

## License

[MIT](LICENSE)
