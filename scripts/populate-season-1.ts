
import { prisma } from '../src/lib/prisma';
import { populateSeason } from '../src/lib/cup-engine';

async function main() {
  const season = await prisma.cupSeason.findUnique({
    where: { slug: 'season-1' },
  });

  if (!season) {
    console.error('Season 1 not found');
    return;
  }

  console.log(`Found season: ${season.name} (${season.id})`);
  console.log('Populating with top 32 qualifiers...');

  try {
    const result = await populateSeason(
      season.id,
      season.qualificationStart,
      season.qualificationEnd
    );
    console.log(`Successfully populated season with ${result.participants.length} participants.`);
  } catch (error) {
    console.error('Failed to populate season:', error);
  }
}

main()
  .catch(console.error);
