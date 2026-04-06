# Web3Me — Complete Feature Audit

> For copywriter use. Covers every user-facing feature, user flows, and technical details.

---

## Overview

Web3Me is a Solana trader profile platform that showcases on-chain trading performance, rankings, and achievements. Users sign in with Twitter, link Solana wallets, and get an auto-generated profile page showing verified trading stats. Think "Linktree meets on-chain analytics."

---

## 1. Authentication

**How it works:** Users sign in with Twitter/X via Privy. No passwords, no email — just Twitter OAuth.

**User Flow:**
1. Click "Sign in with X" on the login page
2. Twitter OAuth popup opens
3. Account is created or claimed (pre-seeded KOL profiles get claimed on first login)
4. Redirected to dashboard
5. Session lasts 7 days

**Key details:**
- Twitter-only authentication (via Privy)
- JWT session stored in secure HTTP-only cookie
- Pre-seeded profiles (KOLs) get "claimed" badge on first login

---

## 2. Profile Creation & URL

**What happens after sign-in:**
- Profile URL generated automatically: `web3me.fun/@username`
- Twitter display name, avatar, and handle synced
- Profile is public immediately

**Customizable fields:**
- Display name
- Bio (short text)
- Accent color (8 presets or custom hex)
- Banner image URL (recommended 1200x400px)

---

## 3. Wallet Linking

**How it works:** Users paste Solana wallet addresses to link them to their profile. Multiple wallets supported.

**User Flow:**
1. Go to Dashboard → Wallets
2. Paste a Solana wallet address
3. Click "Add" — wallet is validated and linked
4. Click "Sync" to pull on-chain trade history
5. Stats (PnL, win rate, trades) populate after sync
6. Can remove wallets anytime

**Key details:**
- Solana wallets only
- Multiple wallets per user
- Each wallet shows individual stats
- Combined stats shown on profile

---

## 4. On-Chain Data Indexing

**What it does:** Automatically fetches and parses every swap transaction from linked wallets using Helius (Solana's leading RPC provider).

**What's tracked:**
- Every token swap (buy/sell)
- Transaction amounts in SOL
- Token metadata (name, symbol, image)
- Portfolio holdings (current balances)

**How it works:**
- First sync: fetches up to 2,000 transactions
- Subsequent syncs: only new transactions since last fetch
- Detects BUY vs SELL based on SOL flow direction
- Aggregates by token (total bought, total sold, net PnL)
- Background cron refreshes all users every 4 hours

**Key details:**
- Data source: Helius API (RPC + DAS)
- Incremental fetching (cursor-based)
- Token metadata cached for performance
- Retry logic for rate limits

---

## 5. PnL Calculation

**How profit/loss is calculated:**
- Per trade: `PnL = Total Sold (SOL) - Total Bought (SOL)`
- Per wallet: Sum of all token PnLs
- Per user: Sum across all wallets
- USD conversion using live SOL price

**Win Rate:** Percentage of trades where PnL > 0

**Time Periods:**
- 1 day, 3 days, 7 days, all-time
- Stored in rankings table, updated every 4 hours

**Key detail:** All stats are on-chain verified — no manual entry, no faking.

---

## 6. Leaderboard

**What it does:** Public ranking of all traders by realized PnL.

**Features:**
- Filter by period: 1D, 3D, 7D, ALL
- Shows: rank, avatar, username, PnL (USD + SOL), win rate, trade count
- "Claimed" badge for verified Twitter users
- Click any trader to view their full profile
- Updated every 4 hours via cron
- Paginated (50 per page)

---

## 7. The Trencher Cup (Tournament)

**What it is:** A bracket-style tournament showcasing the top 32 traders.

**Structure:**
- **Group Stage:** 32 traders split into 4 groups of 8
- **Quarter-Finals:** Group winners face off (4 matches)
- **Semi-Finals:** 2 matches
- **Grand Final:** 1 match
- **Champion:** Winner displayed with trophy

**How it works:**
- Top 32 traders by 7-day PnL automatically qualify
- Rankings determine seeding
- Higher PnL wins each matchup
- Bracket displays horizontally with scroll-synced animation
- Trophy overlay reveals as user scrolls through the bracket

**Prize:** 69% of all $WEB3ME trading fees distributed to top performers + cup prizes

---

## 8. Profile Page Features

**Every public profile (`web3me.fun/@username`) includes:**

### Header
- Banner image (customizable)
- Avatar (from Twitter)
- Display name + @handle
- Bio
- Follower count (from Twitter)
- "Claimed" badge (verified Twitter auth)
- Wallet selector (if multiple wallets)

### Degen Badge
An archetype assigned based on trading behavior:
- **DEGEN GOD** (90+ score) — Elite, consistent, high conviction
- **DIAMOND HANDS** (60+, holds 24h+) — Patient holder
- **SCALPER** (60+, holds <1h) — Quick trader
- **APE MACHINE** (50+, 100+ trades) — High volume
- **WHALE HUNTER** (50+, avg 10+ SOL) — Large positions
- **PAPER HANDS** (10+ trades, <35% WR) — Exits early
- **DEGENERATE** (30+) — Chaotic energy
- **ROOKIE** (<30) — New trader

Score is computed from 4 components (0-25 each): Activity, Performance, Consistency, Conviction.

### Stats Strip
- Total PnL (USD)
- Win Rate %
- Trade Count

### Trade Calendar
GitHub-style heat map showing trading activity over last 90 days. Color intensity = trade frequency.

### PnL Chart
Line chart showing cumulative PnL over time, aggregated by day.

### Pinned Trades (max 5)
Showcase best trades with:
- Token symbol + image
- PnL percentage
- Buy/sell amounts in SOL
- Transaction timeline

### Portfolio Holdings
Current token balances fetched live from Solana:
- Top 20 holdings by USD value
- Token symbol, balance, value
- Links to DexScreener

### Token Deployments
Tokens launched by the user (Pump.fun, Raydium, etc.):
- Symbol, market cap ATH, holders, volume
- Status (bonding / migrated)
- Dev PnL

### Social Links
Custom links with emoji icons:
- Twitter, Discord, Telegram, YouTube, Instagram, GitHub, Twitch, Gaming, Website, Custom

---

## 9. Dashboard

**Central hub for authenticated users:**

### Main Dashboard
- Profile preview card
- Setup checklist (sign in, link wallet, add link, pin trade)
- Accent color picker
- Banner URL input
- Display name + bio editor
- Social links manager (add/remove/reorder)

### Wallets Page
- List all linked wallets with per-wallet stats
- Add new wallet (address validation)
- Sync button (on-demand Helius fetch)
- Remove wallet

### Trades Page
- View all detected trades from all wallets
- Pin/unpin trades to profile (max 5)
- Sort by PnL

---

## 10. Sharing & Social Cards

**What it does:** Dynamic OG images for Twitter/social sharing.

**When shared on Twitter:**
- Rich preview card with trader stats
- Title: `@username — Web3Me`
- Description: PnL, win rate, trade count, bio
- Dynamically generated image

**Share button** on profile tweets the profile URL with card link.

**Card page** at `/@username/card` — clean, shareable view.

---

## 11. Token Deployer Leaderboard

**What it does:** Ranks users who deploy tokens (Pump.fun, Raydium) by total dev PnL.

**Tracked data:**
- Token mint, symbol, name, image
- Platform (pump.fun, raydium, etc.)
- Status (bonding, migrated, graduated)
- Market cap ATH
- Holder count, volume
- Dev PnL (SOL + USD)

**Deployer rankings:** Sorted by total dev PnL across all deployments.

---

## 12. Vault / Revenue Sharing

**The promise:** 69% of all $WEB3ME trading fees are distributed back to the community.

**Distribution:**
- Weekly payouts to ranked traders
- Trencher Cup prizes
- Sent directly to linked wallets every Sunday

**Vault display:** Live counter on landing page showing accumulated SOL.

---

## 13. Activity Ticker

**What it is:** Scrolling ticker at the top of the landing page showing recent trading activity.

**Shows:** Recent pinned trades — `@username · $TOKEN · +X%`

**Updates:** Fetched from `/api/ticker`, cached for 60 seconds.

---

## 14. API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/auth/login` | Create session via Privy token |
| `POST /api/auth/logout` | Clear session |
| `GET/PATCH /api/profile` | Read/update profile |
| `GET/POST/DELETE /api/wallets` | Wallet CRUD |
| `POST /api/wallets/sync` | Fetch on-chain trades |
| `GET /api/trades` | All user trades |
| `GET/POST/DELETE /api/trades/pin` | Pin/unpin trades |
| `GET/POST/PATCH/DELETE /api/links` | Social links CRUD |
| `GET /api/leaderboard` | Rankings (period, limit, offset) |
| `GET /api/leaderboard/deployers` | Deployer rankings |
| `GET /api/profile/stats` | User stats by period |
| `GET /api/profile/pnl-history` | Cumulative PnL time series |
| `GET /api/profile/portfolio` | Current token holdings |
| `GET /api/ticker` | Recent activity feed |
| `GET /api/deployments` | Token deployments |

---

## 15. Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js (App Router) |
| Auth | Privy (Twitter OAuth) |
| Database | PostgreSQL via Prisma |
| Cache | Redis |
| Blockchain | Helius (Solana RPC + DAS API) |
| Hosting | Vercel |
| Token Data | DexScreener, Pump.fun |
| Social Data | fxtwitter (follower counts) |

---

## Key Differentiators (for copywriter)

1. **On-chain verified** — All stats come directly from Solana. No manual entry, no faking.
2. **Twitter-native** — Sign in with X, your handle becomes your URL.
3. **Automatic indexing** — Link wallet, we do the rest. Every swap tracked.
4. **Degen Score** — Unique archetype system that classifies trading style.
5. **Revenue sharing** — 69% of fees back to the community.
6. **Tournament system** — Competitive bracket for top traders.
7. **One URL** — Everything about your trading identity in one shareable link.
