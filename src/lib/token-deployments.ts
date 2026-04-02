import { prisma } from './prisma';
import { getWalletTransactions, getTokenMetadata } from './helius';
import { cached } from './redis';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

const PUMP_FUN_PROGRAM = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';

// ─── Types ───────────────────────────────────────────────────

export interface DetectedDeployment {
  tokenMint: string;
  tokenSymbol: string;
  tokenName: string | null;
  tokenImageUrl: string | null;
  platform: string;
  deployedAt: Date;
}

interface TokenStats {
  holders: number | null;
  status: string;
}

// ─── Detect Token Deployments from Helius Transactions ──────

export async function detectTokenDeployments(
  walletAddress: string,
): Promise<DetectedDeployment[]> {
  const { txns } = await getWalletTransactions(walletAddress);

  const deployMints: { mint: string; timestamp: number; platform: string }[] = [];

  for (const tx of txns) {
    const desc = (tx.description || '').toLowerCase();
    const source = (tx.source || '').toLowerCase();
    const isPumpFun =
      desc.includes('pump') ||
      source.includes('pump') ||
      desc.includes(PUMP_FUN_PROGRAM);

    // Type CREATE — explicit token creation
    if (tx.type === 'CREATE' && tx.tokenTransfers?.length > 0) {
      const mint = tx.tokenTransfers[0].mint;
      if (mint) {
        deployMints.push({
          mint,
          timestamp: tx.timestamp,
          platform: isPumpFun ? 'pump.fun' : 'unknown',
        });
        continue;
      }
    }

    // Description-based detection
    const isCreateAction =
      desc.includes('create') ||
      desc.includes('launch') ||
      desc.includes('deploy') ||
      desc.includes('initialized');

    if (isCreateAction && tx.tokenTransfers?.length > 0) {
      // The wallet must be the fee payer (initiator)
      const isFeePayer =
        tx.nativeTransfers?.some(
          (nt) => nt.fromUserAccount === walletAddress && nt.amount > 0,
        ) ?? false;

      if (isFeePayer) {
        // Find the new token mint (not SOL)
        const nonSol = tx.tokenTransfers.find(
          (t) => t.mint !== 'So11111111111111111111111111111111111111112',
        );
        if (nonSol) {
          deployMints.push({
            mint: nonSol.mint,
            timestamp: tx.timestamp,
            platform: isPumpFun ? 'pump.fun' : 'raydium',
          });
        }
      }
    }
  }

  // Deduplicate by mint
  const uniqueMints = new Map<string, { timestamp: number; platform: string }>();
  for (const d of deployMints) {
    if (!uniqueMints.has(d.mint)) {
      uniqueMints.set(d.mint, { timestamp: d.timestamp, platform: d.platform });
    }
  }

  if (uniqueMints.size === 0) return [];

  // Fetch metadata for all detected mints
  const mintKeys = Array.from(uniqueMints.keys());
  const metadata = await getTokenMetadata(mintKeys);

  const deployments: DetectedDeployment[] = [];
  for (const [mint, info] of uniqueMints) {
    const meta = metadata.get(mint);
    deployments.push({
      tokenMint: mint,
      tokenSymbol: meta?.symbol || mint.slice(0, 6),
      tokenName: meta?.name || null,
      tokenImageUrl: meta?.image || null,
      platform: info.platform,
      deployedAt: new Date(info.timestamp * 1000),
    });
  }

  return deployments;
}

// ─── Get Token Stats via Helius DAS ─────────────────────────

export async function getTokenStats(mintAddress: string): Promise<TokenStats> {
  try {
    const res = await fetch(HELIUS_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'token-stats',
        method: 'getAsset',
        params: { id: mintAddress },
      }),
    });

    if (!res.ok) return { holders: null, status: 'bonding' };

    const data = await res.json();
    const asset = data.result;
    if (!asset) return { holders: null, status: 'bonding' };

    // Check if token is "dead" — burnt or frozen
    const isFrozen = asset.ownership?.frozen === true;
    const supply = asset.token_info?.supply ?? 0;
    const status = isFrozen || supply === 0 ? 'dead' : 'bonding';

    return { holders: null, status };
  } catch {
    return { holders: null, status: 'bonding' };
  }
}

// ─── Fetch holder count from Helius REST ────────────────────

async function getHolderCount(mintAddress: string): Promise<number | null> {
  try {
    const url = `https://api.helius.xyz/v0/token-metadata?api-key=${HELIUS_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mintAccounts: [mintAddress], includeOffChain: false }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const info = data?.[0];
    return info?.onChainAccountInfo?.holderCount ?? null;
  } catch {
    return null;
  }
}

// ─── Refresh All Deployments for a User ─────────────────────

export async function refreshTokenDeployments(
  userId: string,
  wallets: { address: string }[],
): Promise<void> {
  const allDeployments: (DetectedDeployment & { walletAddress: string })[] = [];

  for (const wallet of wallets) {
    try {
      const detected = await cached(
        `deployments:detect:${wallet.address}`,
        300, // 5 min cache
        () => detectTokenDeployments(wallet.address),
      );

      for (const d of detected) {
        allDeployments.push({ ...d, walletAddress: wallet.address });
      }
    } catch {
      // Skip wallet on failure
    }
  }

  // Upsert each deployment
  for (const dep of allDeployments) {
    // Get current stats
    const stats = await getTokenStats(dep.tokenMint);
    const holders = await getHolderCount(dep.tokenMint);

    await prisma.tokenDeployment.upsert({
      where: { tokenMint: dep.tokenMint },
      create: {
        userId,
        walletAddress: dep.walletAddress,
        tokenMint: dep.tokenMint,
        tokenSymbol: dep.tokenSymbol,
        tokenName: dep.tokenName,
        tokenImageUrl: dep.tokenImageUrl,
        platform: dep.platform,
        status: stats.status,
        holders: holders ?? stats.holders,
        deployedAt: dep.deployedAt,
        updatedAt: new Date(),
      },
      update: {
        tokenSymbol: dep.tokenSymbol,
        tokenName: dep.tokenName,
        tokenImageUrl: dep.tokenImageUrl,
        status: stats.status,
        holders: holders ?? stats.holders,
        updatedAt: new Date(),
      },
    });
  }
}
