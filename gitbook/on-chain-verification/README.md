# How We Index Trades

Web3Me's credibility depends on accurate, tamper-proof trade data. Here's exactly how we index and verify every trade.

## Data Source: Helius

We use **Helius Enhanced Transactions API** — the industry-standard Solana indexer. Helius pre-parses raw Solana transactions into structured data with:
- Transaction type classification (SWAP, TRANSFER, etc.)
- Token transfer details (mint address, amounts, accounts)
- Native SOL balance changes
- Human-readable descriptions

## What Counts as a Trade

Only **SWAP** type transactions are counted. Specifically:

1. Transaction must be classified as `type: "SWAP"` by Helius
2. Must involve at least one non-SOL token transfer
3. Wallet's native SOL balance must change by more than 0.0001 SOL
4. Token must be received (BUY) or sent (SELL) by the tracked wallet

### What Does NOT Count
- Token transfers (airdrops, sends between your own wallets)
- NFT purchases or sales
- Staking/unstaking transactions
- DeFi operations (lending, borrowing, LP provision)
- Failed transactions

## PnL Computation

For each token, PnL is computed as:

```
PnL (SOL) = Total SOL received from sells - Total SOL spent on buys
PnL (%)   = (Sell SOL - Buy SOL) / Buy SOL × 100
```

This is **realized PnL only** — tokens you're still holding don't count as profit or loss until you sell.

## Multi-Hop Resolution

Solana DEX aggregators (Jupiter, Raydium) often route swaps through multiple tokens. For example: Token A → USDC → SOL → Token B.

Web3Me handles this by:
1. Identifying all non-SOL tokens in the transaction
2. Checking which token the wallet directly received or sent
3. Attributing the SOL change to the first relevant token
4. Breaking after the first match to avoid double-counting

## Token Metadata

For every token encountered, we fetch metadata from Helius DAS API:
- **Symbol** — the ticker (e.g., $BONK)
- **Name** — full token name
- **Image** — token logo URL
- **Fallback** — if metadata unavailable, first 6 characters of the mint address

## Refresh Cadence

| Operation | Frequency | Method |
|-----------|-----------|--------|
| Wallet sync | Hourly | Vercel cron + Helius API |
| Token metadata | On-demand | Helius DAS (cached) |
| Portfolio holdings | 2 min cache | Helius getAssetsByOwner |
| Leaderboard | 2 min cache | Prisma + Redis |
| Profile page | 5 min cache | Redis |

## Auditability

Every piece of data on Web3Me is traceable back to on-chain transactions:
- Each `WalletTrade` record stores the token mint, buy/sell SOL, trade count, and timestamps
- The `lastSignature` cursor on each wallet allows anyone to verify which transactions were processed
- No manual data entry — everything comes from Helius indexing of the Solana blockchain
