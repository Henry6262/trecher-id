# Helius Integration

Web3Me uses Helius as the primary Solana blockchain data provider. Helius offers Enhanced Transactions and the Digital Asset Standard (DAS) API — both critical for accurate PnL computation.

## Transaction Fetching

### Enhanced Transactions API
Every wallet sync fetches transactions through Helius Enhanced Transactions, which provides:
- Pre-parsed transaction type (SWAP, TRANSFER, etc.)
- Token transfer details (mint, amount, from/to accounts)
- Native balance changes in lamports
- Human-readable descriptions

### Incremental Sync
Web3Me uses cursor-based pagination to avoid re-processing old transactions:

1. **First sync:** Fetches up to 10 pages (1,000 transactions) going back as far as possible
2. **Subsequent syncs:** Uses `lastSignature` cursor to only fetch new transactions
3. **Hourly cron:** Runs every hour via Vercel cron, processing all users in batches

This means the system never wastes Helius credits re-fetching known data.

## Trade Detection

Only `SWAP` type transactions are counted as trades. The detection logic:

1. Filter for `tx.type === 'SWAP'`
2. Identify non-SOL token transfers in the swap
3. Check wallet's native balance change (SOL spent or received)
4. Classify as BUY (SOL decreased, tokens received) or SELL (SOL increased, tokens sent)
5. Handle multi-hop routes (attribute SOL to first relevant token to avoid double-counting)

**Minimum threshold:** 0.0001 SOL to catch micro trades while filtering dust.

## Token Metadata (DAS API)

For every token encountered in trades, Web3Me fetches metadata via Helius DAS `getAssetBatch`:
- Token symbol and full name
- Token logo/image URL
- Used for trade cards, portfolio display, and pinned trades

Metadata is cached in-memory to avoid redundant API calls.

## Portfolio Holdings (DAS API)

The portfolio view uses `getAssetsByOwner` to show current token holdings:
- Fetches all fungible tokens in the wallet
- Includes price data (`price_info.total_price`) when available
- Filters dust (< $0.01 or < 0.001 balance)
- Merges holdings across multiple linked wallets

## Webhook Integration

For real-time updates, Web3Me can receive Helius webhooks:
- **Endpoint:** Configured in Helius dashboard
- **Latency:** Sub-second from on-chain confirmation
- **Use case:** Instant trade detection without polling

This is how Web3Me achieves <1 second trade detection — compared to competitors who poll Dune every 5-30 minutes.
