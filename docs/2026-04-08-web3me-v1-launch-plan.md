# Web3Me V1 Launch Plan

- Status: Approved
- Owner: Henry
- Date: 2026-04-08
- Depends On: `docs/FEATURE_AUDIT.md`

## Progress Since Approval

This plan is now in execution, not just planning.

Completed since the reset:

- exact trade-event persistence has been added through `WalletTradeEvent`
- the production database migration for exact event rows has been applied
- wallet rebuild and backfill flows have been hardened so recovery is atomic and rerunnable
- the live DB state has been repaired for non-zero-trade wallets
- public profiles now distinguish aggregate truth from event-driven analytics
- behavioral analytics are hidden when exact event coverage is insufficient
- profile / ranking copy has been tightened to avoid overstating certainty

Implication:

`web3me` is now materially closer to a credible v1 centered on trust, proof, and shareable identity.

## Product Role

`web3me` is the first public product release in the current portfolio strategy.

Its purpose is to turn DevPrint-grade onchain truth into:

- verified trader identity
- public reputation
- rankings and comparison
- a shareable proof surface

This is the clearest market-facing wedge in the portfolio.

## Core Promise

"Your onchain trading track record, verified and presented as a public identity."

The product should feel trustworthy, legible, and socially useful. It should not depend on users understanding the entire underlying stack.

## Target User

Primary user:

- Solana trader who wants proof, status, and a public resume built on real activity

Secondary users:

- audiences evaluating trader credibility
- communities and partners looking for ranking and reputation primitives

## V1 Scope

### Must Ship

- authentication and account creation
- wallet linking
- indexed and aggregated trading history
- public profile page
- verified stats surface
- leaderboard and ranking views
- shareability and social proof elements

### Strongly Preferred For V1

- profile customization that strengthens identity without increasing product complexity
- clean share cards and profile URLs
- clear explanation of what is verified versus user-supplied

### Not Required For V1

- large tournament complexity if it slows launch
- broad AI-driven feature surface
- feature branches that depend on weak or inconsistent data
- extra product modules that do not help prove the core identity story

## Launch Thesis

V1 does not need to prove everything.

It needs to prove:

- users understand the product quickly
- users trust the stats enough to share them
- ranked identity is compelling
- the portfolio can convert internal intelligence into a public product

## Dependencies On DevPrint

`web3me` should treat DevPrint as the preferred truth source for:

- wallet activity quality
- trade normalization
- performance aggregates
- reputation-grade ranking inputs

Any metric that cannot yet be trusted should either be:

- excluded from v1
- labeled clearly as provisional

## Launch Blockers

The following should be treated as blockers, not polish items:

- unclear data provenance
- stats that are not trusted internally
- profile surfaces that imply more certainty than the data supports
- missing distinction between verified and user-entered data
- slow or inconsistent wallet indexing for launch-critical flows

## Current Status

### Already Resolved

- exact event persistence path exists
- destructive rebuild failure mode is removed
- profile trust boundaries are materially cleaner
- zero-event wallets have been distinguished from true zero-trade wallets

### Still To Resolve

- finish removing non-essential or confusing v1 surface area
- review profile, leaderboard, share, and onboarding flows end to end
- confirm which public surfaces are launch-critical versus nice-to-have
- tighten launch messaging so the product promise is immediately legible

## V1 Trust Boundary

For launch purposes, `web3me` should present two classes of truth:

### Aggregate truth

Safe for public display:

- total PnL
- win rate
- trade count
- leaderboard placement
- wallet coverage

These come from indexed wallet aggregates and ranking data.

### Event-driven analytics

Only show when exact event coverage is sufficiently complete:

- PnL history chart
- trade calendar
- ROI / streak / hold-time analytics
- notable-trade insights
- trader-archetype style behavioral interpretation

If exact event coverage is incomplete, these should stay hidden instead of being reconstructed into fake precision for v1.

## Metrics For A Good Launch

We should measure:

- profile creation rate
- wallet-link completion rate
- successful sync rate
- percentage of users who publish or share their profile
- leaderboard engagement
- trust-related user feedback

The first release wins if users believe the product tells the truth and want that truth attached to their identity.

## Post-V1 Expansion

Only after v1 trust is established should we expand into:

- larger tournament experiences
- richer social mechanics
- advanced AI-derived profile insights
- deeper monetization and partner mechanics

## Near-Term Execution Order

1. finish the remaining v1 surface cleanup
2. review profile, leaderboard, share-card, and onboarding flows end to end
3. remove or defer anything that weakens the identity / proof story
4. define the first `devprint`-to-`web3me` truth contract
5. launch with a narrow, credible promise

## Immediate Next Checklist

- audit remaining public surfaces for implied precision
- finalize which analytics are in v1 versus deferred
- confirm launch copy and product framing
- verify sync / ranking / profile reliability on a fresh test pass
- prepare a launch-readiness snapshot doc once the above is complete
