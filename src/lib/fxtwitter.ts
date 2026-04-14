/**
 * Fetch Twitter profile data via fxtwitter (no auth needed).
 * Returns follower count, avatar URL, and banner URL.
 */
export interface FxTwitterProfile {
  followerCount: number | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
}

export async function fetchFxTwitterProfile(username: string): Promise<FxTwitterProfile> {
  try {
    const res = await fetch(`https://api.fxtwitter.com/${username}`, {
      headers: { 'User-Agent': 'web3me/1.0' },
    });
    if (!res.ok) return { followerCount: null, avatarUrl: null, bannerUrl: null };

    const data = await res.json();
    const user = data.user;
    if (!user) return { followerCount: null, avatarUrl: null, bannerUrl: null };

    return {
      followerCount: user.followers ?? user.followers_count ?? null,
      avatarUrl: (user.avatar_url ?? null)?.replace('_normal', '_400x400') ?? null,
      bannerUrl: user.banner_url ?? null,
    };
  } catch {
    return { followerCount: null, avatarUrl: null, bannerUrl: null };
  }
}
