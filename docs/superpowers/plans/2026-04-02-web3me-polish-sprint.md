# Web3Me Full Polish Sprint — 2026-04-02

## Goal
Ship 5 features that make Web3Me production-ready for real KOLs: claim flow, claimed badge, share card OG image, Vercel cron, and dashboard wallet UX.

## Context
- Repo: `/Users/henry/Documents/Gazillion-dollars/Ponzinomics/use-case-apps/web3me/`
- Branch: `feature/web3me-next` (worktree at `.worktrees/web3me-features/`)
- Framework: Next.js 16 App Router, Prisma 7, ioredis, Privy auth, Tailwind CSS v4
- Design: cut-corner glassmorphism, cyan `#00D4FF` accent, dark `#050508` bg
- Components: `GlassCard`, `CutCorner`, `CutButton`, `BorderGlow` all exist
- `prisma generate` is in the build script — run it after any schema change

## Task 1 — Claim Flow (login route + schema)

**File:** `src/app/api/auth/login/route.ts`
**Schema:** `prisma/schema.prisma` — add `isClaimed Boolean @default(false)` to `User` model

**Problem:** The login route uses `prisma.user.upsert({ where: { privyUserId } })`. Pre-seeded KOL profiles have no `privyUserId`, so real KOLs log in and get a brand-new empty profile instead of inheriting their seeded data.

**Fix:**
1. Add `isClaimed Boolean @default(false)` to `User` in `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add-is-claimed` (or `db push` for Vercel Postgres)
3. In the login route, after verifying the Privy token and extracting `twitter.username`:
   - First try `prisma.user.findUnique({ where: { privyUserId } })` — if found, update display name and return
   - If NOT found, check `prisma.user.findUnique({ where: { username: twitter.username } })` — if found AND `privyUserId` is null (seeded, unclaimed), update that row: set `privyUserId`, `twitterId`, `displayName`, `avatarUrl`, `isClaimed: true`
   - If STILL not found, create a brand-new user
4. JWT should use the found/updated user's `id`

**Do NOT** create a duplicate user. The upsert pattern needs to become a manual find-then-update.

## Task 2 — "Claimed" Badge on Profile + Leaderboard

**Files:**
- `src/components/profile-header.tsx`
- `src/components/leaderboard-table.tsx`
- `src/app/[username]/page.tsx` (pass `isClaimed` to ProfileCard/ProfileHeader)

**What to build:**
- A small inline badge component (inline, not a separate file) — shows a cyan checkmark + "VERIFIED" when `isClaimed` is true
- Badge style: `text-[10px] font-mono tracking-widest text-[#00D4FF] border border-[#00D4FF]/30 px-1.5 py-0.5` with a cut-corner clip
- Add it next to the username in `ProfileHeader` (after the `@username` line, before bio)
- In `LeaderboardTable`, show a small `✓` cyan icon next to claimed users' names
- The profile page SSR query already fetches the user — just pass `isClaimed` through

## Task 3 — Share Card OG Image

**File:** `src/app/[username]/card/opengraph-image.tsx` (NEW)

**What to build:**
- Next.js `ImageResponse` (from `next/og`) route at `/[username]/card`
- The `generateImageMetadata` + default export pattern for App Router OG images
- Card design (1200×630): dark bg `#050508`, left panel with avatar circle + `@username` + archetype name, right panel with 3 stat boxes (PnL, Win Rate, Trades), bottom row of trade pills (up to 3 pinned trades showing token symbol + pnl%), cyan `#00D4FF` accent color throughout
- Fetch user data from Prisma (same query as the share card page: `wallets` + `pinnedTrades`)
- Use inline styles only (ImageResponse doesn't support Tailwind)
- Font: load Inter from Google Fonts using the `fetch` pattern Next.js docs show

**Reference:** The share card page at `src/app/[username]/card/page.tsx` already has the data shape — mirror its data fetching.

## Task 4 — Vercel Cron Configuration

**Files:**
- `vercel.json` (CREATE at repo root)
- `src/app/api/cron/refresh-stats/route.ts` (small fix to auth header)

**What to build:**
1. Create `vercel.json` at the project root with:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/refresh-stats",
         "schedule": "0 */6 * * *"
       }
     ]
   }
   ```
2. Vercel sends cron requests with `Authorization: Bearer <CRON_SECRET>` — the existing route already checks this. But Vercel also sends the header `x-vercel-cron: 1` — update the auth check to accept EITHER the bearer token OR the `x-vercel-cron` header when in production (so Vercel's own scheduler can call it without needing to embed the secret in the schedule config).
3. Add a comment at the top of the route explaining the `CRON_SECRET` env var must be set in Vercel dashboard.

**Note:** `vercel.json` goes in the same directory as `package.json` (the web3me project root, NOT the monorepo root).

## Task 5 — Dashboard Wallet UX Redesign

**File:** `src/app/dashboard/wallets/page.tsx`

**What to build:**
- Replace `CutCorner` with `GlassCard` for all cards (import from `@/components/glass-card`)
- Per-wallet stats row: show cached `totalPnlUsd`, `winRate`, `totalTrades` from the wallet object if non-null (these are already in the DB, just not displayed). Format: `$12.4K PnL · 67% WR · 234 trades` in muted mono text
- Add a "Fetch Trades" button per wallet that POSTs to `/api/wallets/[address]/sync` — if that route doesn't exist, make it a visual-only button with a `// TODO` comment
- Better empty state: when no wallets, show a large centered illustration-free empty state card with `"No wallets linked yet"` headline + `"Add your Solana wallet address below to import your trading history"` subtext
- Validation: basic check that the address looks like a Solana address (base58, 32-44 chars) before calling the API — show inline error if invalid

## Execution Order
1 → 2 → 3 → 4 → 5 (each task is independent enough to execute sequentially without conflicts)

## Success Criteria
- [ ] Real KOL logging in gets their seeded profile (not a blank new one)
- [ ] `isClaimed` profiles show cyan verified badge on profile + leaderboard
- [ ] `/[username]/card` unfurls with a proper image when shared on Twitter
- [ ] `vercel.json` cron kicks off refresh every 6 hours
- [ ] Dashboard wallets page shows stats per wallet + uses GlassCard
