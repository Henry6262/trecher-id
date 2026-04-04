# Wallet Linking

Link your Solana wallets to aggregate your trading performance across all addresses.

## How to Link

1. Go to **Dashboard → Wallets**
2. Enter your Solana wallet address
3. The system validates the address format
4. Click **Add Wallet**
5. Your wallet begins syncing immediately

## Multiple Wallets

You can link as many Solana wallets as you want. All PnL, trades, and portfolio data is aggregated:
- **Leaderboard ranking** uses combined PnL from all wallets
- **Degen Score** considers trading patterns across all wallets
- **Portfolio view** shows merged holdings
- **Trade calendar** shows activity from all wallets

## Primary Wallet

Set one wallet as your **primary** (main) wallet:
- Displayed with a star icon on your profile
- Used for receiving Trencher Cup and weekly payout rewards
- Can be changed anytime in the dashboard

## Sync Process

When you add a wallet, Web3Me:
1. Fetches up to 1,000 recent transactions from Helius
2. Identifies all SWAP transactions
3. Aggregates per-token PnL (buy SOL vs sell SOL)
4. Stores results in the database with a cursor
5. Hourly cron fetches only new transactions after the cursor

### Sync Status
Each wallet shows:
- **Last synced** timestamp
- **Total trades** detected
- **PnL** for that wallet
- **Win rate** for that wallet
- Manual **Sync** button for on-demand refresh

## Supported Chains

Currently, Web3Me supports **Solana only**. All PnL tracking, portfolio viewing, and tournament qualification is based on Solana trading activity.

EVM support may be added in future versions.
