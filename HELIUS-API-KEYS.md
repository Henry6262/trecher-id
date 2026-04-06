# Helius API Keys

Used for Solana RPC + transaction indexing. Rotate across keys to avoid rate limits.

| # | Key | Notes |
|---|-----|-------|
| 1 | (from .env.local HELIUS_API_KEY) | Primary — used by app |
| 2 | `6f853f8e-1c23-40c7-9a2d-f14977331725` | Rotation key |
| 3 | `8020970f-a413-450c-99bc-e516c06860a5` | Rotation key |
| 4 | `a70cdbc1-8fd1-4d30-ac3d-762d1f35102f` | Rotation key |

## Usage

- App uses key 1 from `HELIUS_API_KEY` env var
- Batch scripts (`scripts/nuke-and-recalc.ts`) rotate across all 4 keys round-robin
- Helius free tier: 10 req/s per key — 4 keys = ~40 req/s effective
