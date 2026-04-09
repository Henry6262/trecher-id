import { fetchFxTwitterProfile } from '@/lib/fxtwitter';
import { cached } from '@/lib/redis';
import { getPublicAvatarUrl, normalizeImageUrl } from '@/lib/images';

export async function resolveAvatarUrl(input: {
  username: string;
  avatarUrl?: string | null;
}): Promise<string> {
  const normalized = normalizeImageUrl(input.avatarUrl);
  if (normalized) {
    return normalized;
  }

  const profile = await cached(`avatar:${input.username.toLowerCase()}`, 60 * 60 * 6, async () =>
    fetchFxTwitterProfile(input.username),
  );

  return getPublicAvatarUrl(input.username, profile.avatarUrl);
}

export async function resolveAvatarRows<T extends { username: string; avatarUrl: string | null }>(
  rows: T[],
): Promise<T[]> {
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      avatarUrl: await resolveAvatarUrl(row),
    })),
  );
}
