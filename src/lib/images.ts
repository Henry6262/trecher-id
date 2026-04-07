export function normalizeImageUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('//')) return `https:${url}`;
  return url;
}
