import { SignJWT } from 'jose';

export function isTestAuthEnabled() {
  return process.env.TEST_AUTH_ENABLED === '1';
}

export async function signSessionToken(user: { id: string; username: string }) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET env var is not set');
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  return new SignJWT({ sub: user.id, username: user.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
}

export function normalizeTestUsername(raw?: string | null) {
  const normalized = (raw ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 24);

  if (normalized.length >= 3) {
    return normalized;
  }

  return `tester_${Date.now().toString(36)}`.slice(0, 24);
}
