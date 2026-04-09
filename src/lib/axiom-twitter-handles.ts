export interface AxiomTwitterHandleOverride {
  seededUsername: string;
  walletAddress: string;
  twitterHandle: string;
  source: 'gist' | 'orb';
}

// These trader rows were originally seeded from Axiom with synthetic usernames.
// When we later resolved the real X handles, we need to key the override by wallet
// so banner/avatar backfills don't keep hitting fake handles like `beaver_axiom`.
export const AXIOM_TWITTER_HANDLE_OVERRIDES: AxiomTwitterHandleOverride[] = [
  {
    seededUsername: '2fbb_trader',
    walletAddress: '2FbbtmK9MN3Zxkz3AnqoAGnRQNy2SVRaAazq2sFSbftM',
    twitterHandle: 'iconXBT',
    source: 'orb',
  },
  {
    seededUsername: '4zdc_trader',
    walletAddress: '4ZdCpHJrSn4E9GmfP8jjfsAExHGja2TEn4JmXfEeNtyT',
    twitterHandle: 'roboPBOC',
    source: 'gist',
  },
  {
    seededUsername: 'beaver_axiom',
    walletAddress: 'GM7Hrz2bDq33ezMtL6KGidSWZXMWgZ6qBuugkb5H8NvN',
    twitterHandle: 'beaverd',
    source: 'gist',
  },
  {
    seededUsername: 'classic_axiom',
    walletAddress: 'DsqRyTUh1R37asYcVf1KdX4CNnz5DKEFmnXvgT4NfTPE',
    twitterHandle: 'mrclassic33',
    source: 'orb',
  },
  {
    seededUsername: 'cxltures',
    walletAddress: '3ZtwP8peTwTfLUF1rgUQgUxwyeHCxfmoELXghQzKqnAJ',
    twitterHandle: 'cxlturesvz',
    source: 'gist',
  },
  {
    seededUsername: 'dan176_axiom',
    walletAddress: 'J2B5fnm2DAAUAGa4EaegwQFoYaN6B5FerGA5sjtQoaGM',
    twitterHandle: '176Dan',
    source: 'gist',
  },
  {
    seededUsername: 'dddemonology',
    walletAddress: 'A2MwjTFz4jzT1mY4xrqkwm1vAbZDrqnA6QJoyTAU8Djw',
    twitterHandle: 'dddemono7ogy',
    source: 'orb',
  },
  {
    seededUsername: 'evening_axiom',
    walletAddress: 'E7gozEiAPNhpJsdS52amhhN2XCAqLZa7WPrhyR6C8o4S',
    twitterHandle: 'eveningbtc',
    source: 'orb',
  },
  {
    seededUsername: 'fozzy_axiom',
    walletAddress: 'B9oKseVKRntTvfADyaUoH7oVmoyVbBfUf4NKyQc4KK2D',
    twitterHandle: 'fozzycapone',
    source: 'orb',
  },
  {
    seededUsername: 'insentos_axiom',
    walletAddress: '7SDs3PjT2mswKQ7Zo4FTucn9gJdtuW4jaacPA65BseHS',
    twitterHandle: 'insentos',
    source: 'gist',
  },
  {
    seededUsername: 'jalen_axiom',
    walletAddress: 'F72vY99ihQsYwqEDCfz7igKXA5me6vN2zqVsVUTpw6qL',
    twitterHandle: 'RipJalens',
    source: 'gist',
  },
  {
    seededUsername: 'lyxe_axiom',
    walletAddress: 'HLv6yCEpgjQV9PcKsvJpem8ESyULTyh9HjHn9CtqSek1',
    twitterHandle: 'cryptolyxe',
    source: 'gist',
  },
  {
    seededUsername: 'old_axiom',
    walletAddress: 'CA4keXLtGJWBcsWivjtMFBghQ8pFsGRWFxLrRCtirzu5',
    twitterHandle: 'old',
    source: 'gist',
  },
  {
    seededUsername: 'radiance_axiom',
    walletAddress: 'FAicXNV5FVqtfbpn4Zccs71XcfGeyxBSGbqLDyDJZjke',
    twitterHandle: 'radiancebrr',
    source: 'orb',
  },
  {
    seededUsername: 'spike_axiom',
    walletAddress: 'FhsSfTSHok3ryVfyuLSD1t9frc4c1ymyCr3S11Ci718z',
    twitterHandle: 'NotSpikeG',
    source: 'orb',
  },
  {
    seededUsername: 'trenchman_axiom',
    walletAddress: 'Hw5UKBU5k3YudnGwaykj5E8cYUidNMPuEewRRar5Xoc7',
    twitterHandle: 'trenchmanjames',
    source: 'orb',
  },
];

const byWallet = new Map(
  AXIOM_TWITTER_HANDLE_OVERRIDES.map((entry) => [entry.walletAddress, entry]),
);

const byUsername = new Map(
  AXIOM_TWITTER_HANDLE_OVERRIDES.map((entry) => [entry.seededUsername, entry]),
);

export function getAxiomTwitterHandleOverride(input: {
  walletAddress?: string | null;
  username?: string | null;
}): AxiomTwitterHandleOverride | null {
  if (input.walletAddress && byWallet.has(input.walletAddress)) {
    return byWallet.get(input.walletAddress)!;
  }

  if (input.username && byUsername.has(input.username)) {
    return byUsername.get(input.username)!;
  }

  return null;
}

export function getPreferredTwitterHandle(input: {
  walletAddress?: string | null;
  username?: string | null;
}): string | null {
  return getAxiomTwitterHandleOverride(input)?.twitterHandle ?? input.username ?? null;
}
