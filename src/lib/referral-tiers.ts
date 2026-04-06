export const REFERRAL_TIERS = [
  { min: 1,   max: 3,          boost: 2   },
  { min: 4,   max: 5,          boost: 5   },
  { min: 6,   max: 15,         boost: 7.5 },
  { min: 16,  max: 25,         boost: 10  },
  { min: 26,  max: 50,         boost: 13  },
  { min: 51,  max: 99,         boost: 15  },
  { min: 100, max: Infinity,   boost: 20  },
] as const;

export function getBoostPercent(validatedCount: number): number {
  if (validatedCount <= 0) return 0;
  for (const tier of REFERRAL_TIERS) {
    if (validatedCount >= tier.min && validatedCount <= tier.max) return tier.boost;
  }
  return 0;
}

export function getTierInfo(validatedCount: number) {
  let currentTier: (typeof REFERRAL_TIERS)[number] | null = null;
  let nextTier: (typeof REFERRAL_TIERS)[number] | null = null;

  for (let i = 0; i < REFERRAL_TIERS.length; i++) {
    const tier = REFERRAL_TIERS[i];
    if (validatedCount >= tier.min && validatedCount <= tier.max) {
      currentTier = tier;
      nextTier = REFERRAL_TIERS[i + 1] ?? null;
      break;
    }
  }

  // User has 0 referrals — next tier is the first one
  if (!currentTier && validatedCount === 0) {
    nextTier = REFERRAL_TIERS[0];
  }

  const remaining = nextTier ? nextTier.min - validatedCount : 0;

  return { currentTier, nextTier, remaining };
}
