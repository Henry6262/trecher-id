import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { createAuthClient, PONZINOMICS_COOKIE_NAME } from '@/lib/ponzinomics';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export interface SessionUser {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string | null;
  privyId?: string;
  accessToken?: string;
}

/**
 * Get the current session user.
 * Tries Ponzinomics access token first, falls back to local JWT.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();

  // Try Ponzinomics access token first
  const ponzToken = cookieStore.get(PONZINOMICS_COOKIE_NAME)?.value;
  if (ponzToken) {
    try {
      const client = createAuthClient(ponzToken);
      const user = await client.auth!.getMe();
      return {
        id: user.privyId, // Ponzinomics uses privyId as unique identifier
        username: user.twitterHandle || user.privyId,
        displayName: user.displayName || undefined,
        avatarUrl: user.avatar || null,
        privyId: user.privyId,
        accessToken: ponzToken,
      };
    } catch {
      // Token expired or invalid — fall through to local JWT
    }
  }

  // Fallback: local JWT (legacy auth)
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.sub as string,
      username: payload.username as string,
    };
  } catch {
    return null;
  }
}
