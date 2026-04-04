# AI Trade Analysis

Web3Me's intelligence layer goes beyond simple PnL computation. The system analyzes trading patterns, classifies trader behavior, and provides insights that no other platform offers.

## Training Data

The AI models are trained on real data from the DevPrint pipeline:

| Dataset | Size | Source |
|---------|------|--------|
| Tokens tracked | 77,000+ | On-chain + DexScreener |
| Tweet-to-token pairs | 13,000+ | Twitter monitoring |
| Training examples | 48,000+ | Labeled outcomes |
| Labeled outcomes | 1,100+ | pump/stable/rug/dead |

## Analysis Pipeline

### 1. Swap Detection
Every Solana transaction is filtered for SWAP type operations. Multi-hop routes (token A → SOL → token B) are resolved to identify the actual tokens the trader interacted with.

### 2. PnL Aggregation
For each token, the system computes:
- **Total buy SOL** — sum of all SOL spent acquiring the token
- **Total sell SOL** — sum of all SOL received selling the token
- **Net PnL** — sell minus buy
- **PnL %** — (sell - buy) / buy * 100
- **Trade count** — number of individual swap transactions

### 3. Pattern Recognition
The system identifies trading patterns used for Degen Score classification:
- **Hold duration** — average time between first buy and last sell
- **Position sizing** — average SOL per trade
- **Frequency** — trades per day/week
- **Win rate** — percentage of tokens traded profitably
- **Risk tolerance** — largest single position relative to portfolio

### 4. Outcome Correlation
Using DevPrint's outcome tracker, Web3Me correlates trading signals with actual token performance:
- Was this token called by a Tier 1 KOL?
- Did the trader buy before or after the signal?
- What happened to the token at T+1h, T+6h, T+24h?

## Token Intelligence

Every token in the system has metadata enrichment:
- **Symbol & name** from Helius DAS
- **Logo/image** for visual display
- **DexScreener link** for chart access
- **Outcome label** (when available from DevPrint pipeline)

## What This Enables

- **Degen Score** — AI-computed trader archetype (see next section)
- **Achievement unlocks** — Automatic pattern-based achievement detection
- **Leaderboard accuracy** — Rankings based on verified on-chain data, not self-reported claims
- **Trencher Cup qualification** — Only real, verified PnL counts
