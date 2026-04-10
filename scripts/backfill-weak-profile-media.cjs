const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

const envPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const databaseUrl = env.match(/^DATABASE_URL="([^"]+)"/m)?.[1];

if (!databaseUrl) {
  throw new Error('DATABASE_URL not found in .env.local');
}

const HANDLE_OVERRIDES = new Map([
  ['2fbb_trader', 'iconXBT'],
  ['4zdc_trader', 'roboPBOC'],
  ['beaver_axiom', 'beaverd'],
  ['classic_axiom', 'mrclassic33'],
  ['cxltures', 'cxlturesvz'],
  ['dan176_axiom', '176Dan'],
  ['dddemonology', 'dddemono7ogy'],
  ['evening_axiom', 'eveningbtc'],
  ['fozzy_axiom', 'fozzycapone'],
  ['insentos_axiom', 'insentos'],
  ['jalen_axiom', 'RipJalens'],
  ['lyxe_axiom', 'cryptolyxe'],
  ['old_axiom', 'old'],
  ['radiance_axiom', 'radiancebrr'],
  ['spike_axiom', 'NotSpikeG'],
  ['trenchman_axiom', 'trenchmanjames'],
]);

const SYNTHETIC_USERNAMES = new Set([
  'dev_7m9fhs2v',
  'dev_b9zbs2w9',
  'dev_bogxgz5y',
  'dev-bot',
  'dev_crtrjrzu',
  'dev_eicqkxsu',
  'dev_eq8wrbs8',
  'dev_exn4wxqm',
  'dev_fdfyqqen',
  'dev_gzvseaaj',
  'dev_j2e7ndo7',
]);

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getAvatarInitial(username) {
  const clean = username.replace(/[^a-z0-9]/gi, '').trim();
  return (clean[0] ?? '?').toUpperCase();
}

function generatedAvatar(username) {
  const seed = hashString(username.toLowerCase());
  const hueA = seed % 360;
  const hueB = (hueA + 48 + (seed % 72)) % 360;
  const accentHue = (hueA + 180) % 360;
  const initial = getAvatarInitial(username);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
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
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function generatedBanner(username) {
  const seed = hashString(`${username}:banner`);
  const hueA = seed % 360;
  const hueB = (hueA + 36) % 360;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${hueA} 70% 18%)" />
        <stop offset="100%" stop-color="hsl(${hueB} 74% 10%)" />
      </linearGradient>
      <radialGradient id="flare" cx="22%" cy="30%" r="52%">
        <stop offset="0%" stop-color="hsla(${(hueA + 160) % 360} 100% 70% / 0.35)" />
        <stop offset="100%" stop-color="hsla(${(hueA + 160) % 360} 100% 40% / 0)" />
      </radialGradient>
    </defs>
    <rect width="1200" height="400" fill="url(#bg)" />
    <rect width="1200" height="400" fill="url(#flare)" />
    <g opacity="0.15">
      <path d="M0 290 C 180 200, 340 360, 520 280 S 880 150, 1200 250" stroke="rgba(255,255,255,0.35)" stroke-width="6" fill="none" />
      <path d="M0 320 C 140 250, 300 370, 500 320 S 870 220, 1200 300" stroke="rgba(0,212,255,0.28)" stroke-width="4" fill="none" />
    </g>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

async function fetchFxTwitter(handle) {
  try {
    const res = await fetch(`https://api.fxtwitter.com/${handle}`, {
      headers: { 'User-Agent': 'trencher-id-backfill/1.0' },
    });

    if (!res.ok) {
      return null;
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return null;
    }

    const data = await res.json();
    return data?.user ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  const { rows } = await client.query(`
    select u.id, u."username", u."avatarUrl", u."bannerUrl", l.url as x_link
    from "User" u
    left join "Link" l on l."userId" = u.id and l.icon = 'x'
    where u."avatarUrl" like '%unavatar.io%'
       or u."avatarUrl" = '/avatar-fallback.svg'
    order by u."username" asc
  `);

  let updatedAvatar = 0;
  let updatedBanner = 0;
  let generatedAvatarCount = 0;
  let generatedBannerCount = 0;
  let realAvatarCount = 0;
  let realBannerCount = 0;
  let fxMisses = 0;

  for (const row of rows) {
    const username = row.username;

    if (SYNTHETIC_USERNAMES.has(username)) {
      const avatarUrl = generatedAvatar(username);
      const bannerUrl = row.bannerUrl || generatedBanner(username);
      await client.query(
        'update "User" set "avatarUrl" = $1, "bannerUrl" = coalesce("bannerUrl", $2) where id = $3',
        [avatarUrl, bannerUrl, row.id],
      );

      updatedAvatar += 1;
      generatedAvatarCount += 1;
      if (!row.bannerUrl) {
        updatedBanner += 1;
        generatedBannerCount += 1;
      }

      console.log(`${username}\tsynthetic\tgenerated_avatar${row.bannerUrl ? '' : '+generated_banner'}`);
      continue;
    }

    const linkHandle = row.x_link?.match(/x\.com\/([^/?#]+)/)?.[1] ?? null;
    const handle = HANDLE_OVERRIDES.get(username) ?? linkHandle ?? username;
    const fxUser = await fetchFxTwitter(handle);

    if (!fxUser) {
      const avatarUrl = generatedAvatar(username);
      const bannerUrl = row.bannerUrl || generatedBanner(username);
      await client.query(
        'update "User" set "avatarUrl" = $1, "bannerUrl" = coalesce("bannerUrl", $2) where id = $3',
        [avatarUrl, bannerUrl, row.id],
      );

      updatedAvatar += 1;
      generatedAvatarCount += 1;
      if (!row.bannerUrl) {
        updatedBanner += 1;
        generatedBannerCount += 1;
      }
      fxMisses += 1;

      console.log(`${username}\t${handle}\tgenerated_avatar${row.bannerUrl ? '' : '+generated_banner'}\tfx_miss`);
      continue;
    }

    const avatarUrl = fxUser.avatar_url?.replace('_normal', '_400x400') ?? generatedAvatar(username);
    const bannerUrl = row.bannerUrl || fxUser.banner_url || generatedBanner(username);

    await client.query(
      'update "User" set "avatarUrl" = $1, "bannerUrl" = coalesce("bannerUrl", $2) where id = $3',
      [avatarUrl, bannerUrl, row.id],
    );

    updatedAvatar += 1;
    if (fxUser.avatar_url) {
      realAvatarCount += 1;
    } else {
      generatedAvatarCount += 1;
    }

    if (!row.bannerUrl) {
      updatedBanner += 1;
      if (fxUser.banner_url) {
        realBannerCount += 1;
      } else {
        generatedBannerCount += 1;
      }
    }

    console.log(
      `${username}\t${handle}\t${fxUser.avatar_url ? 'real_avatar' : 'generated_avatar'}${!row.bannerUrl && fxUser.banner_url ? '+real_banner' : !row.bannerUrl ? '+generated_banner' : ''}`,
    );

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(
    `SUMMARY\tupdated_avatar=${updatedAvatar}\tupdated_banner=${updatedBanner}\treal_avatar=${realAvatarCount}\tgenerated_avatar=${generatedAvatarCount}\treal_banner=${realBannerCount}\tgenerated_banner=${generatedBannerCount}\tfx_miss=${fxMisses}`,
  );

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
