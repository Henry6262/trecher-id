
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const pool = new pg.Pool({ connectionString: url });

async function main() {
  const seasonSlug = 'season-1';
  
  // Timeline:
  // Qualification: Ends April 30, 23:59:59
  // Group Stage: May 1 00:00 - May 3 00:00 (48h)
  // R16: May 3 00:00 - May 5 00:00 (48h)
  // QF: May 5 00:00 - May 7 00:00 (48h)
  // SF: May 7 00:00 - May 9 00:00 (48h)
  // Final: May 9 00:00 - May 11 00:00 (48h)

  const qualEnd = new Date('2026-04-30T23:59:59Z');
  const groupStart = new Date('2026-05-01T00:00:00Z');
  const groupEnd = new Date('2026-05-03T00:00:00Z');
  const r16Start = new Date('2026-05-03T00:00:00Z');
  const r16End = new Date('2026-05-05T00:00:00Z');
  const qfStart = new Date('2026-05-05T00:00:00Z');
  const qfEnd = new Date('2026-05-07T00:00:00Z');
  const sfStart = new Date('2026-05-07T00:00:00Z');
  const sfEnd = new Date('2026-05-09T00:00:00Z');
  const finalStart = new Date('2026-05-09T00:00:00Z');
  const finalEnd = new Date('2026-05-11T00:00:00Z');

  console.log(`Updating dates for ${seasonSlug}...`);

  const query = `
    UPDATE "CupSeason"
    SET 
      "qualificationEnd" = $1,
      "groupStart" = $2,
      "groupEnd" = $3,
      "r16Start" = $4,
      "r16End" = $5,
      "qfStart" = $6,
      "qfEnd" = $7,
      "sfStart" = $8,
      "sfEnd" = $9,
      "finalStart" = $10,
      "finalEnd" = $11,
      "updatedAt" = NOW()
    WHERE "slug" = $12
    RETURNING *
  `;

  const values = [
    qualEnd, groupStart, groupEnd, r16Start, r16End,
    qfStart, qfEnd, sfStart, sfEnd, finalStart, finalEnd,
    seasonSlug
  ];

  const res = await pool.query(query, values);

  if (res.rows.length > 0) {
    console.log('Successfully updated Season 1 dates:');
    console.log(JSON.stringify(res.rows[0], null, 2));
  } else {
    console.error('Season 1 not found');
  }
}

main().catch(console.error).finally(() => pool.end());
