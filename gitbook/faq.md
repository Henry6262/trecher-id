# FAQ

## General

### What is Web3Me?
Web3Me is a verified trading profile platform for Solana. Link your wallet, and your on-chain trading performance becomes a shareable profile — like Linktree meets Bloomberg Terminal.

### Is Web3Me free?
Yes. Creating a profile, linking wallets, and participating in the leaderboard is completely free. The Trencher Cup and weekly payouts don't require any entry fee.

### How do I get started?
Visit [web3me.fun](https://web3me.fun), sign in with Twitter, and link your Solana wallet. Your trading history is indexed automatically.

## Trading Data

### Where does the PnL data come from?
All data comes directly from the Solana blockchain via Helius Enhanced Transactions API. No self-reporting, no manual entry.

### How often is my data updated?
Hourly via automated cron. Portfolio holdings are cached for 2 minutes. Profile data is cached for 5 minutes.

### Why doesn't my latest trade show up?
The hourly cron processes all users in batches. Your trade will appear within 1-2 hours. You can also manually sync from the dashboard.

### Do you track all Solana transactions?
No — only SWAP transactions count. Transfers, staking, NFTs, and other DeFi operations are excluded.

### What about unrealized PnL?
Only realized PnL (completed buys + sells) counts. Tokens you're still holding don't affect your ranking.

## $WEB3ME Token

### What is $WEB3ME?
The native token of the Web3Me platform on Solana. Creator fees from $WEB3ME transactions fund the Reward Vault.

### How much goes to the Reward Vault?
69% of all creator fees flow directly to the Reward Vault. This funds the Trencher Cup prizes and weekly leaderboard payouts.

### Where can I buy $WEB3ME?
On any Solana DEX — Jupiter, Raydium, or search the contract address on DexScreener.

## Trencher Cup

### How do I qualify?
Be in the top 32 traders by realized PnL during the 4-week qualification period.

### How does the bracket work?
Champions League format: 8 groups of 4, top 2 advance, then single-elimination knockout (R16 → QF → SF → Final).

### What do winners get?
The Reward Vault is distributed: 50% to Champion, 25% to Runner-up, 15% to 3rd, 10% to 4th.

### When is the first Trencher Cup?
Announced after $WEB3ME token launch. Follow [@web3me](https://twitter.com/web3me) for dates.

## Technical

### What is the Degen Score?
An AI-computed 0-100 rating that classifies your trading style into one of 8 archetypes (Crown, Gem, Scissors, Zap, Anchor, etc.) based on on-chain trading patterns.

### What is DevPrint?
Our proprietary Rust-based real-time data pipeline that monitors social signals and Solana transactions with sub-second latency. It gives Web3Me a massive data freshness advantage over competitors.

### Can I use Web3Me with EVM wallets?
Not yet. Web3Me currently supports Solana only. EVM support may be added in future versions.

### Is my data private?
Your trading data is already public on the Solana blockchain. Web3Me aggregates and displays it in a user-friendly format. Your profile is public by default — that's the point.

## Account

### How do I delete my profile?
Contact us on Twitter. Profile deletion removes all stored data but doesn't affect on-chain transactions (those are permanent).

### Can I change my username?
Your username is your Twitter handle. To change it, update your Twitter username and re-claim your profile.

### I'm a known KOL and my profile already exists — how do I claim it?
Sign in with the Twitter account that matches the profile username. The system automatically matches and verifies your identity.
