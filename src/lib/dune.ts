const DUNE_API_KEY = process.env.DUNE_API_KEY;
const DUNE_BASE = 'https://api.dune.com/api/v1';

export interface DuneDeployer {
  deployer_wallet: string;
  total_deployed: number;
  total_migrated: number;
  dev_pnl_sol: number;
  dev_pnl_usd: number;
  best_token_name: string | null;
  best_token_mint: string | null;
  best_token_mcap: number | null;
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

  const rows = await executeDuneQuery<DuneDeployer>(DEPLOYER_QUERY_ID);
  return rows.slice(0, limit);
}
