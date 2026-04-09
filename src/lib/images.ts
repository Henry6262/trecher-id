export function normalizeImageUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('//')) return `https:${url}`;
  return url;
}

export function getPublicAvatarUrl(username: string, avatarUrl?: string | null) {
  return normalizeImageUrl(avatarUrl) ?? `https://unavatar.io/x/${username}`;
}
