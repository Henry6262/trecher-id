const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export interface ProfileUpdateInput {
  bio?: unknown;
  displayName?: unknown;
  accentColor?: unknown;
  bannerUrl?: unknown;
}

export function validateProfileUpdate(input: ProfileUpdateInput) {
  const updates: {
    bio?: string | null;
    displayName?: string;
    accentColor?: string | null;
    bannerUrl?: string | null;
  } = {};

  if (input.displayName !== undefined) {
    if (typeof input.displayName !== 'string') {
      return { error: 'displayName must be a string' } as const;
    }

    const displayName = input.displayName.trim();
    if (displayName.length < 1 || displayName.length > 32) {
      return { error: 'displayName must be between 1 and 32 characters' } as const;
    }

    updates.displayName = displayName;
  }

  if (input.bio !== undefined) {
    if (typeof input.bio !== 'string') {
      return { error: 'bio must be a string' } as const;
    }

    const bio = input.bio.trim();
    if (bio.length > 160) {
      return { error: 'bio must be 160 characters or less' } as const;
    }

    updates.bio = bio || null;
  }

  if (input.accentColor !== undefined) {
    if (input.accentColor !== null && input.accentColor !== '' && typeof input.accentColor !== 'string') {
      return { error: 'accentColor must be a string' } as const;
    }

    if (typeof input.accentColor === 'string' && input.accentColor !== '' && !HEX_COLOR.test(input.accentColor)) {
      return { error: 'accentColor must be a valid hex color' } as const;
    }

    updates.accentColor = input.accentColor ? input.accentColor : null;
  }

  if (input.bannerUrl !== undefined) {
    if (input.bannerUrl !== null && input.bannerUrl !== '' && typeof input.bannerUrl !== 'string') {
      return { error: 'bannerUrl must be a string' } as const;
    }

    if (typeof input.bannerUrl === 'string' && input.bannerUrl !== '' && !isHttpUrl(input.bannerUrl)) {
      return { error: 'bannerUrl must be a valid http or https URL' } as const;
    }

    updates.bannerUrl = input.bannerUrl ? input.bannerUrl : null;
  }

  return { updates } as const;
}
