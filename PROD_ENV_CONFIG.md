# Trecher-ID (web3me) Production Environment Configuration
> Generated: 2026-04-16
> Source: .env.vercel-prod

This document contains the production environment variables used for the Trecher-ID / web3me project, which is built on the **DevPrint Core** infrastructure.

### 1. Database Infrastructure
| Key | Description | Value (Redacted) |
| :--- | :--- | :--- |
| `DATABASE_URL` | Primary PostgreSQL (Railway) | `postgresql://postgres:[REDACTED]@hopper.proxy.rlwy.net:10087/railway` |
| `POSTGRES_URL` | Secondary PostgreSQL (Railway) | `postgresql://postgres:[REDACTED]@crossover.proxy.rlwy.net:21662/railway` |
| `PRISMA_DATABASE_URL` | Prisma Data Proxy Connection | `postgres://[REDACTED]@db.prisma.io:5432/postgres?sslmode=require` |
| `REDIS_URL` | Redis Cache (Railway) | `redis://default:[REDACTED]@crossover.proxy.rlwy.net:34102` |

### 2. Core DevPrint / Ponzinomics Endpoints
| Key | Description | Production URL |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Main Frontend | `https://trecher-id.vercel.app` |
| `NEXT_PUBLIC_API_URL` | Core Backend API (Monolith) | `https://core-api-production-20f7.up.railway.app` |
| `NEXT_PUBLIC_CHAIN_API_URL` | Chain/On-chain Data API | `https://chain-api-production-c23e.up.railway.app` |
| `NEXT_PUBLIC_AI_API_URL` | AI & Signal Intelligence API | `https://ai-api-production-97cd.up.railway.app` |
| `NEXT_PUBLIC_LEARNING_API_URL` | Training/Learning API | `https://learning-api-production-51d5.up.railway.app` |
| `PONZINOMICS_BASE_URL` | Ponzinomics Reputation API | `https://api.ponzinomics.io` |

### 3. Third-Party Integrations
| Key | Description | Value / Status |
| :--- | :--- | :--- |
| `HELIUS_API_KEY` | Solana RPC & Webhooks | **[REDACTED]** |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Web3 Auth (Privy) Public ID | `cmn5gqs8k00k00cl7tyyutd38` |
| `PRIVY_APP_SECRET` | Web3 Auth (Privy) Secret | **[REDACTED]** |

### 4. Authentication & Security
| Key | Description | Value / Status |
| :--- | :--- | :--- |
| `JWT_SECRET` | Token Signing Secret | **[REDACTED]** |
| `CRON_SECRET` | Cron Job Verification | **[REDACTED]** |

### 5. Build & Deployment Settings
| Key | Value |
| :--- | :--- |
| `VERCEL` | `1` |
| `VERCEL_ENV` | `production` |
| `VERCEL_TARGET_ENV` | `production` |
| `NX_DAEMON` | `false` |
| `TURBO_REMOTE_ONLY` | `true` |
| `TURBO_RUN_SUMMARY` | `true` |
| `TURBO_CACHE` | `remote:rw` |

---
**Core Integration Note:** 
Trench-ID (web3me) serves as the identity and social layer for the DevPrint engine. It leverages shared services for token parsing, AI concept generation, and cross-chain reputation (Ponzinomics).

**Warning:** Never commit unredacted versions of these variables to public source control.
