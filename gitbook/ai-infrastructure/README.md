# Architecture Overview

Web3Me is backed by a multi-layer infrastructure stack that processes Solana trading data in real-time.

## System Architecture

```
LAYER 1: INGESTION
├── Helius WebSocket (sub-second Solana transaction detection)
├── J7Tracker (tier-based KOL monitoring, 3s for top tier)
├── Twitter/Telegram/Reddit (multi-platform signal ingestion)
└── DexScreener (price snapshots + outcome tracking)
        │
        ↓
LAYER 2: PROCESSING (DevPrint — Rust Pipeline)
├── tweet-ingest → Redis Streams → ai-parser
├── Swap detection & multi-hop route resolution
├── Per-token PnL aggregation (buy/sell netting)
├── Llama 3.3 70B meme concept scoring
└── Outcome labeling (pump / stable / rug / dead)
        │
        ↓
LAYER 3: INTELLIGENCE
├── Degen Score engine (8 archetypes, 0-100)
├── Achievement pattern recognition (12 achievements)
├── Trade calendar heatmap (52-week activity)
├── Win/loss classification per token
└── Incremental wallet sync (only new transactions)
        │
        ↓
LAYER 4: GAMIFICATION (Ponzinomics SDK)
├── Points & leaderboard rankings
├── Daily streaks & battle pass progression
├── Trencher Cup tournament brackets
└── Reward Vault distribution
        │
        ↓
LAYER 5: PRESENTATION (Next.js 16)
├── SSR profile pages with OG images
├── PnL history chart (TradingView lightweight-charts)
├── Portfolio holdings (Helius DAS API)
├── Real-time leaderboard with period filtering
└── Tournament bracket (Champions League format)
```

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Real-time pipeline | **Rust + Tokio** | Sub-second transaction processing |
| Message bus | **Redis Streams** | Inter-service communication |
| AI models | **Llama 3.3 70B** | Token concept scoring + meme analysis |
| Blockchain indexer | **Helius** | Enhanced Transactions + DAS API |
| Frontend | **Next.js 16 + React 19** | SSR profiles, dashboard, leaderboard |
| Charts | **TradingView lightweight-charts** | PnL history visualization |
| Auth | **Privy** | Twitter login + wallet linking |
| Database | **PostgreSQL (Railway)** | User data, trades, rankings |
| Cache | **Redis (ioredis)** | Profile + leaderboard caching |
| Gamification | **Ponzinomics SDK** | Points, achievements, tournaments |
| Deploy | **Vercel** (web) + **Railway** (services) | Production hosting |

## Data Flow

1. **Helius webhook** fires on every Solana transaction involving tracked wallets
2. **DevPrint pipeline** processes the raw transaction in Rust (<100ms)
3. **Trade aggregation** computes per-token PnL (buy SOL vs sell SOL)
4. **Ranking engine** updates leaderboard positions hourly
5. **Profile pages** serve fresh data with 5-minute Redis cache
6. **Trencher Cup** qualifies top 32 traders for bracket competition

## Scale

- **77,000+** tokens tracked and analyzed
- **13,000+** tweet-to-token signal pairs
- **45+** pre-populated KOL profiles
- **Hourly** cron refreshes all wallet data
- **Sub-second** transaction detection via webhooks
