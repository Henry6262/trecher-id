# DevPrint Pipeline

DevPrint is Web3Me's proprietary real-time data pipeline, built entirely in Rust for maximum throughput and minimum latency.

## What It Does

DevPrint monitors social media and blockchain activity simultaneously, processing signals through a chain of specialized microservices connected via Redis Streams.

## Microservices

### 1. Tweet Ingest
**Purpose:** Multi-platform social signal monitoring

- Twitter polling with tier-based frequency:
  - **Tier 1 KOLs:** Every 3 seconds (top alpha callers)
  - **Tier 2 Degens:** Every 10 seconds
  - **Tier 3 Meme accounts:** Every 30 seconds
  - **Tier 4 Discovery:** Every 60 seconds
- Telegram Bot API monitoring
- Reddit /r/new.json scanning
- J7Tracker WebSocket for real-time alpha detection

### 2. AI Parser
**Purpose:** Filter noise, score signals, generate trading intelligence

- Meme token filter (eliminates spam, scams, low-quality signals)
- Llama 3.3 70B for concept scoring and analysis
- Rate-limited to 20 LLM calls/hour for cost control
- Outputs structured trade signals with confidence scores

### 3. Token Deployer
**Purpose:** Automated Pump.fun token deployment (for DevPrint's own operations)

- Dry-run mode for safe testing
- Tiered image generation (1ms template / 1s AI-generated)
- Pump.fun integration with initial buy

### 4. Outcome Tracker
**Purpose:** Track what happens to every detected token

- DexScreener price snapshots at T+0, T+1h, T+6h, T+24h
- Auto-labels outcomes: **pump** / **stable** / **rug** / **dead**
- Feeds labeled data back to AI parser for model improvement
- Currently tracking 77,000+ tokens

### 5. API Gateway
**Purpose:** Expose pipeline data to Web3Me and other consumers

- REST API: `/api/status`, `/api/deployments`, `/api/stats`
- WebSocket: `/ws` for live pipeline events
- Health monitoring for all services

## Inter-Service Communication

All services communicate through Redis Streams with consumer groups:

```
pipeline:tweets           → tweet-ingest writes
pipeline:deploy-requests  → ai-parser writes
pipeline:deploy-results   → token-deployer writes
pipeline:outcomes         → outcome-tracker writes
pipeline:status           → all services write
```

## How Web3Me Uses DevPrint

Web3Me consumes DevPrint data through two channels:

1. **Helius Webhooks** — Direct transaction notifications for tracked wallets (sub-second)
2. **API Gateway WebSocket** — Live pipeline events for token discovery and alpha signals

This gives Web3Me a massive data freshness advantage over competitors who rely on batch-processed Dune Analytics queries.

## Deployment

DevPrint services run on **Railway** with Redis as the message bus. The pipeline operates 24/7 with automatic reconnection and backoff on rate limits.
