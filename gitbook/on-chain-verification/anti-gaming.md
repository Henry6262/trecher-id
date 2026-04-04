# Anti-Gaming

Web3Me is designed to resist manipulation. Here's how we prevent fake PnL and gaming.

## On-Chain Only

The most fundamental anti-gaming measure: **all data comes directly from the Solana blockchain via Helius**. There is no user input, no manual entry, no admin override. Your PnL is computed from on-chain SWAP transactions — period. What the blockchain says is what your profile shows. Nobody can modify it, not even us.

## Dust Filtering

Transactions below 0.0001 SOL are ignored. This prevents:
- Spam trades designed to inflate trade count
- Dust attacks creating fake trading history
- Micro-wash trades

## Wash Trade Detection

Patterns that suggest wash trading are flagged:
- Buying and selling the same token within the same block
- Repeated small trades between wallets owned by the same user
- Circular token flows (A → B → A)

## Wallet Verification

When you link a wallet, Web3Me checks:
- Valid Solana address format
- The address has transaction history (not a freshly created empty wallet)
- Duplicate addresses across users are prevented

## Realized PnL Only

Only **realized PnL** counts for rankings and the Trencher Cup. This means:
- Holding an unrealized gain doesn't boost your ranking
- You can't inflate your rank by buying tokens and not selling
- Only closed positions (buy + sell) contribute to your score

## No All-Wallet Aggregation Abuse

Users cannot selectively link only their winning wallets. While we can't force users to link every wallet they own, the system tracks:
- When wallets were linked (recent additions during competition periods are noted)
- Consistency of trading patterns across linked wallets
- Suspicious timing of wallet additions

## Minimum Trade Thresholds

For Trencher Cup qualification:
- Minimum number of trades required (prevents single-lucky-trade entries)
- Trades must span multiple days (prevents last-minute cramming)
- PnL must come from multiple tokens (prevents single-token manipulation)

## Community Reporting

If the community suspects gaming, profiles can be flagged for review. Verified gaming results in:
- Removal from leaderboard
- Disqualification from Trencher Cup
- Profile flagged publicly

## The Best Defense

Ultimately, the best anti-gaming measure is that Web3Me uses **the same data everyone can verify on-chain**. There's no proprietary scoring system to exploit — it's pure, transparent, on-chain PnL.
