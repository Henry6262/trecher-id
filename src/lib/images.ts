export function normalizeImageUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('//')) return `https:${url}`;
  // Upgrade Twitter _normal (48×48) to _400x400 wherever it slips through
  if (url.includes('pbs.twimg.com') && url.includes('_normal')) {
    return url.replace(/_normal(\.\w+)$/, '_400x400$1').replace(/_normal$/, '_400x400');
  }
  return url;
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getAvatarInitial(username: string) {
  const clean = username.replace(/[^a-z0-9]/gi, '').trim();
  return (clean[0] ?? '?').toUpperCase();
}

function buildGeneratedAvatar(username: string) {
  const seed = hashString(username.toLowerCase());
  const hueA = seed % 360;
  const hueB = (hueA + 48 + (seed % 72)) % 360;
  const accentHue = (hueA + 180) % 360;
  const initial = getAvatarInitial(username);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="${initial}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="hsl(${hueA} 72% 54%)" />
          <stop offset="100%" stop-color="hsl(${hueB} 78% 38%)" />
        </linearGradient>
        <radialGradient id="glow" cx="30%" cy="25%" r="70%">
          <stop offset="0%" stop-color="hsla(${accentHue} 100% 82% / 0.75)" />
          <stop offset="100%" stop-color="hsla(${accentHue} 100% 55% / 0)" />
        </radialGradient>
      </defs>
      <rect width="96" height="96" rx="24" fill="url(#bg)" />
      <rect x="4" y="4" width="88" height="88" rx="20" fill="url(#glow)" />
      <circle cx="73" cy="23" r="8" fill="hsla(${accentHue} 100% 88% / 0.92)" />
      <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle"
        fill="rgba(255,255,255,0.94)"
        font-family="Arial, Helvetica, sans-serif"
        font-size="42"
        font-weight="700"
        letter-spacing="1">${initial}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function isWeakAvatarUrl(url?: string | null) {
  const normalized = normalizeImageUrl(url);
  if (!normalized) return true;
  return normalized.includes('unavatar.io/') || normalized === '/avatar-fallback.svg';
}

export function hasStrongAvatarUrl(url?: string | null) {
  return !isWeakAvatarUrl(url);
}

export function getPublicAvatarUrl(username: string, avatarUrl?: string | null, options?: { isDeployer?: boolean }) {
  const normalized = normalizeImageUrl(avatarUrl);
  const isWeak = isWeakAvatarUrl(normalized);

  if (normalized && !isWeak) {
    return normalized;
  }

  // Deployers without PFPs get the chef icon
  if (options?.isDeployer) {
    return '/deployer-fallback.svg';
  }

  return buildGeneratedAvatar(username);
}
