# Qualification & Seeding

## How to Qualify

The Trencher Cup qualification period runs for **4 weeks** before each season's tournament begins. During this period, your total realized PnL across all linked wallets determines your qualification rank.

### Requirements
- Active Web3Me profile with at least one linked Solana wallet
- Minimum trade count threshold (prevents single lucky trade qualification)
- Positive realized PnL during the qualification period

### What Counts
- **Realized PnL only** — unrealized gains (tokens you're still holding) don't count
- **SOL-denominated** — all PnL is measured in SOL, converted to USD for display
- **All linked wallets** — your total PnL is the sum across every wallet you've linked
- **Qualification period only** — historical PnL before the qualification window doesn't count

## The Top 32

At the end of the qualification period, the top 32 traders by realized PnL SOL are selected for the Trencher Cup bracket.

Rankings are based on:
1. **Total PnL (SOL)** — primary ranking metric
2. **Win Rate** — tiebreaker #1
3. **Trade Count** — tiebreaker #2
4. **Overall Rank** — tiebreaker #3

## Serpentine Seeding

The 32 qualified traders are seeded into 8 groups of 4 using **serpentine seeding** — the same method used in Champions League group draws.

This ensures balanced groups where the strongest traders are spread evenly:

```
Seed  1 → Group A    (best in Group A)
Seed  2 → Group B
Seed  3 → Group C
...
Seed  8 → Group H
Seed  9 → Group H    (serpentine — reverses direction)
Seed 10 → Group G
...
Seed 16 → Group A
Seed 17 → Group A    (reverses again)
...
Seed 32 → Group H
```

This prevents a "group of death" where all top traders end up in the same bracket.

## After Seeding

Once groups are set, the Group Stage begins. Each trader's ongoing PnL during the tournament determines their standing within their group. Top 2 from each group advance to the knockout rounds.
