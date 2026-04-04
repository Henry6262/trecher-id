const DUNE_API_KEY = process.env.DUNE_API_KEY;
const DUNE_BASE = 'https://api.dune.com/api/v1';

// Raw row shape from Dune query 6183649 (counterparty_research/memecoin-dev-tracker)
interface DuneDeployerRaw {
  creator_address: string;
  total_tokens_created: number;
  tokens_created_7d: number;
  tokens_created_30d: number;
  graduated_tokens: number;
  graduated_tokens_7d: number;
  graduation_ratio: string;
  graduation_ratio_7d: string;
  avg_created_per_day_7d: string;
  pumpfun_created_24h: number;
  bonk_created_24h: number;
}

// Normalized shape used by the rest of the app
export interface DuneDeployer {
  deployer_wallet: string;
  total_deployed: number;
  total_migrated: number;
  graduation_rate: number;
  tokens_7d: number;
  tokens_30d: number;
}

function normalizeDeployer(raw: DuneDeployerRaw): DuneDeployer {
  return {
    deployer_wallet: raw.creator_address,
    total_deployed: raw.total_tokens_created,
    total_migrated: raw.graduated_tokens,
    graduation_rate: parseFloat(raw.graduation_ratio) || 0,
    tokens_7d: raw.tokens_created_7d,
    tokens_30d: raw.tokens_created_30d,
  };
}

interface DuneQueryResult<T> {
  execution_id: string;
  query_id: number;
  state: string;
  result: {
    rows: T[];
    metadata: {
      column_names: string[];
      result_set_bytes: number;
      total_row_count: number;
    };
  };
}

/**
 * Execute a Dune query and wait for results.
 * Uses the execute-then-poll pattern for fresh data,
 * or get-results for cached data.
 */
export async function executeDuneQuery<T>(queryId: number, params?: Record<string, string>): Promise<T[]> {
  if (!DUNE_API_KEY) throw new Error('DUNE_API_KEY not set');

  // Try cached results first (free, no execution credits)
  const cachedRes = await fetch(`${DUNE_BASE}/query/${queryId}/results?limit=50`, {
    headers: { 'X-DUNE-API-KEY': DUNE_API_KEY },
  });

  if (cachedRes.ok) {
    const cached: DuneQueryResult<T> = await cachedRes.json();
    if (cached.state === 'QUERY_STATE_COMPLETED' && cached.result?.rows?.length > 0) {
      return cached.result.rows;
    }
  }

  // No cached results — trigger fresh execution
  const execRes = await fetch(`${DUNE_BASE}/query/${queryId}/execute`, {
    method: 'POST',
    headers: {
      'X-DUNE-API-KEY': DUNE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: params ? JSON.stringify({ query_parameters: params }) : undefined,
  });

  if (!execRes.ok) {
    throw new Error(`Dune execute failed: ${execRes.status} ${await execRes.text()}`);
  }

  const exec: { execution_id: string } = await execRes.json();

  // Poll for completion (max 60s)
  for (let i = 0; i < 12; i++) {
    await new Promise(r => setTimeout(r, 5000));

    const statusRes = await fetch(`${DUNE_BASE}/execution/${exec.execution_id}/results`, {
      headers: { 'X-DUNE-API-KEY': DUNE_API_KEY },
    });

    if (!statusRes.ok) continue;

    const status: DuneQueryResult<T> = await statusRes.json();
    if (status.state === 'QUERY_STATE_COMPLETED') {
      return status.result?.rows ?? [];
    }
  }

  throw new Error('Dune query timed out after 60s');
}

/**
 * Get top memecoin deployers from the forked Dune query.
 * Set DUNE_DEPLOYER_QUERY_ID env var to your forked query ID.
 */
export async function getTopDeployers(limit = 20): Promise<DuneDeployer[]> {
  const DEPLOYER_QUERY_ID = parseInt(process.env.DUNE_DEPLOYER_QUERY_ID ?? '0', 10);

  if (!DEPLOYER_QUERY_ID) {
    throw new Error('DUNE_DEPLOYER_QUERY_ID not set — fork the memecoin dev tracker query and set the ID');
  }

  const rows = await executeDuneQuery<DuneDeployerRaw>(DEPLOYER_QUERY_ID);
  return rows.slice(0, limit).map(normalizeDeployer);
}
