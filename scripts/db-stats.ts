import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const pool = new pg.Pool({ connectionString: url });

async function main() {
  const c1 = await pool.query('SELECT COUNT(*) FROM "User"');
  console.log('Users:', c1.rows[0].count);

  const c2 = await pool.query('SELECT COUNT(*) FROM "Wallet"');
  console.log('Wallets:', c2.rows[0].count);

  const c3 = await pool.query('SELECT COUNT(*) FROM "WalletTradeEvent"');
  console.log('Trade Events:', c3.rows[0].count);

  const c4 = await pool.query(`SELECT COUNT(DISTINCT "userId") FROM "Wallet" WHERE "totalPnlUsd" = 0`);
  console.log('Users with $0 PnL:', c4.rows[0].count);

  const c5 = await pool.query(`SELECT COUNT(DISTINCT "userId") FROM "Wallet" WHERE "winRate" = 0`);
  console.log('Users with 0% winRate:', c5.rows[0].count);

  const c6 = await pool.query(`SELECT COUNT(DISTINCT "userId") FROM "Wallet" WHERE "totalTrades" = 0`);
  console.log('Users with 0 trades:', c6.rows[0].count);

  // Show some zero-PnL wallets
  const c7 = await pool.query(`SELECT w.address, u.username, u."displayName", w."totalPnlUsd", w."winRate", w."totalTrades" FROM "Wallet" w LEFT JOIN "User" u ON u.id = w."userId" WHERE w."totalPnlUsd" = 0 LIMIT 10`);
  console.log('\nSample $0 PnL wallets:');
  c7.rows.forEach(r => console.log(`  ${r.username || 'no user'} — ${r.displayName || ''} — $${r.totalPnlUsd} — WR: ${r.winRate}% — ${r.totalTrades} trades`));
}

main().catch(console.error).finally(() => pool.end());
