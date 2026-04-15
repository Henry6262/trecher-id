
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const pool = new pg.Pool({ connectionString: url });

async function main() {
  const c1 = await pool.query('SELECT COUNT(*) FROM "CupSeason"');
  console.log('Seasons:', c1.rows[0].count);

  const c2 = await pool.query('SELECT COUNT(*) FROM "CupParticipant"');
  console.log('Participants:', c2.rows[0].count);

  const c3 = await pool.query('SELECT * FROM "CupSeason" WHERE status != \'draft\' ORDER BY "createdAt" DESC LIMIT 1');
  if (c3.rows.length > 0) {
    const s = c3.rows[0];
    console.log(`Active Season: ${s.name} (${s.slug})`);
    console.log(`Status: ${s.status}`);
    console.log(`Qual Start: ${s.qualificationStart}`);
    console.log(`Qual End: ${s.qualificationEnd}`);
  } else {
    console.log('No active season found.');
  }
}

main().catch(console.error).finally(() => pool.end());
