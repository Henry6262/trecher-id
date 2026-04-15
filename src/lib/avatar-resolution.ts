import { fetchFxTwitterProfile } from '@/lib/fxtwitter';
import { cached } from '@/lib/redis';
import { getPublicAvatarUrl, normalizeImageUrl } from '@/lib/images';

function isWeakAvatarUrl(url: string | null): boolean {
  return !!url && url.includes('unavatar.io/');
}

export async function resolveAvatarUrl(input: {
  username: string;
  avatarUrl?: string | null;
  isDeployer?: boolean;
}): Promise<string> {
  const normalized = normalizeImageUrl(input.avatarUrl);
  if (normalized && !isWeakAvatarUrl(normalized)) {
    return normalized;
  }

  const profile = await cached(`avatar:${input.username.toLowerCase()}`, 60 * 60 * 6, async () =>
    fetchFxTwitterProfile(input.username),
  );

  const enrichedAvatar = normalizeImageUrl(profile.avatarUrl);
  if (enrichedAvatar) {
    return enrichedAvatar;
  }

  if (normalized && !isWeakAvatarUrl(normalized)) {
    return normalized;
  }

  return getPublicAvatarUrl(input.username, null, { isDeployer: input.isDeployer });
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
