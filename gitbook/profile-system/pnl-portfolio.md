# PnL & Portfolio

Your profile displays two key financial views: historical PnL performance and current holdings.

## PnL History Chart

A TradingView-style area chart showing your cumulative PnL over time.

- **Data source:** Aggregated from all WalletTrade records
- **Chart library:** TradingView lightweight-charts (canvas-based, high performance)
- **Color coding:** Green area fill for positive PnL, red for negative
- **Time range:** All available history
- **Interactivity:** Crosshair tooltip shows exact PnL at any point

The chart updates with every hourly data refresh.

## Period Stats

Your profile header shows stats with period filtering:

| Period | What It Shows |
|--------|---------------|
| 1 Day | Last 24 hours of trading |
| 3 Days | Rolling 3-day window |
| 7 Days | Rolling week |
| All Time | Since first tracked trade |

Each period shows:
- **Total PnL** (USD)
- **Win Rate** (% of profitable tokens)
- **Trade Count**

## Portfolio View

Current token holdings across all linked wallets, showing:

- **Token logo and symbol** — from Helius DAS metadata
- **Balance** — token amount held
- **USD value** — current market value (when price data available)
- **DexScreener link** — click any holding to see the chart

Holdings are sorted by USD value (highest first), limited to top 20 tokens, and exclude dust (< $0.01).

Data refreshes every 2 minutes (cached with stale-while-revalidate).

## Trade Calendar

A 52-week heatmap (GitHub-contribution style) showing daily trading activity:

- **Green cells** — profitable trading days (darker = higher PnL)
- **Red cells** — losing trading days (darker = higher losses)
- **Empty cells** — no trading activity
- **Micro cut-corner styling** — matches the Web3Me design system

The calendar uses on-chain trade data directly — no additional database queries.

## Pinned Trades

Showcase your best trades on your profile:

- Each card shows token logo, symbol, PnL %, PnL SOL, and individual transactions
- Click any card to open the token on DexScreener
- Up to 4 transactions shown per card
- Pin/unpin from the dashboard trades browser
- Drag to reorder
