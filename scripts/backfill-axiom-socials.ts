import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { AXIOM_TWITTER_HANDLE_OVERRIDES } from '../src/lib/axiom-twitter-handles';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const pool = new pg.Pool({ connectionString: url });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

interface FxTwitterUser {
  followers?: number | null;
  followers_count?: number | null;
  avatar_url?: string | null;
  banner_url?: string | null;
}

async function fetchFxTwitterUser(handle: string): Promise<FxTwitterUser | null> {
  const res = await fetch(`https://api.fxtwitter.com/${handle}`, {
    headers: { 'User-Agent': 'web3me-backfill/1.0' },
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data?.user ?? null;
}

async function main() {
  let updatedUsers = 0;
  let updatedBanners = 0;
  let updatedAvatars = 0;
  let updatedLinks = 0;
  let updatedFollowers = 0;
  let notFound = 0;

  for (const override of AXIOM_TWITTER_HANDLE_OVERRIDES) {
    const user = await prisma.user.findUnique({
      where: { username: override.seededUsername },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bannerUrl: true,
      },
    });

    if (!user) {
      console.log(`skip ${override.seededUsername} — user missing`);
      continue;
    }

    const fxUser = await fetchFxTwitterUser(override.twitterHandle);
    if (!fxUser) {
      notFound++;
      console.log(`miss ${override.seededUsername} -> ${override.twitterHandle} — fxtwitter miss`);
      continue;
    }

    const avatarUrl = fxUser.avatar_url?.replace('_normal', '_400x400') ?? null;
    const bannerUrl = fxUser.banner_url ?? null;
    const followerCount = fxUser.followers ?? fxUser.followers_count ?? null;
    const updates: {
      avatarUrl?: string;
      bannerUrl?: string;
      followerCount?: number;
    } = {};

    if (avatarUrl && (!user.avatarUrl || user.avatarUrl.includes('unavatar.io/'))) {
      updates.avatarUrl = avatarUrl;
    }

    if (bannerUrl && !user.bannerUrl) {
      updates.bannerUrl = bannerUrl;
    }

    if (followerCount !== null) {
      updates.followerCount = followerCount;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });
      updatedUsers++;
      if (updates.avatarUrl) updatedAvatars++;
      if (updates.bannerUrl) updatedBanners++;
      if (updates.followerCount !== undefined) updatedFollowers++;
    }

    const linkResult = await prisma.link.updateMany({
      where: { userId: user.id, icon: 'x' },
      data: {
        title: `@${override.twitterHandle}`,
        url: `https://x.com/${override.twitterHandle}`,
      },
    });
    updatedLinks += linkResult.count;

    console.log(
      `${override.seededUsername} -> ${override.twitterHandle} |` +
        ` avatar=${Boolean(updates.avatarUrl)} banner=${Boolean(updates.bannerUrl)}` +
        ` followers=${followerCount ?? 'n/a'} links=${linkResult.count}`,
    );

    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  console.log('\nSummary');
  console.log(`users updated: ${updatedUsers}`);
  console.log(`avatars updated: ${updatedAvatars}`);
  console.log(`banners updated: ${updatedBanners}`);
  console.log(`followers updated: ${updatedFollowers}`);
  console.log(`links updated: ${updatedLinks}`);
  console.log(`fxtwitter misses: ${notFound}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
