
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const pool = new pg.Pool({ connectionString: url });

async function main() {
  const start = new Date('2026-04-13T00:00:00Z');
  const end = new Date('2026-05-10T23:59:59Z');

  const c = await pool.query(`
    SELECT u.username, SUM(wt."tradeCount") as total_trades
    FROM "User" u
    JOIN "Wallet" w ON w."userId" = u.id
    JOIN "WalletTrade" wt ON wt."walletId" = w.id
    WHERE wt."lastTradeAt" >= $1 AND wt."firstTradeAt" <= $2
    GROUP BY u.id
    HAVING SUM(wt."tradeCount") >= 10
    ORDER BY total_trades DESC
  `, [start, end]);

  console.log(`Users with 10+ trades in window: ${c.rows.length}`);
  c.rows.forEach(r => console.log(`  ${r.username}: ${r.total_trades} trades`));
}

main().catch(console.error).finally(() => pool.end());
