
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const pool = new pg.Pool({ connectionString: url });

async function main() {
  const c = await pool.query('SELECT * FROM "CupSeason" WHERE slug = \'season-1\'');
  if (c.rows.length > 0) {
    const s = c.rows[0];
    console.log(`Season: ${s.name} (${s.slug})`);
    console.log(`Status: ${s.status}`);
    console.log(`Qual Start: ${s.qualificationStart}`);
    console.log(`Qual End: ${s.qualificationEnd}`);
    
    const p = await pool.query('SELECT COUNT(*) FROM "CupParticipant" WHERE "seasonId" = $1', [s.id]);
    console.log(`Participants: ${p.rows[0].count}`);
  } else {
    console.log('Season 1 not found.');
  }
}

main().catch(console.error).finally(() => pool.end());
