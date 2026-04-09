import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ALLOWED_ROUTES = new Set(['/', '/leaderboard', '/dashboard']);
const RESERVED_TOP_LEVEL = new Set([
  'api',
  '_next',
  'dashboard',
  'leaderboard',
  'login',
  'preview',
]);
const DASHBOARD_PANEL_BY_PATH: Record<string, string> = {
  '/dashboard/wallets': 'wallets',
  '/dashboard/trades': 'trades',
  '/dashboard/referrals': 'referrals',
};

function isPublicAsset(pathname: string) {
  return pathname.startsWith('/_next/')
    || pathname.startsWith('/api/')
    || pathname === '/favicon.ico'
    || /\.[^/]+$/.test(pathname);
}

function isPublicProfilePath(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return false;

  const [first, second, third] = segments;
  if (RESERVED_TOP_LEVEL.has(first)) {
    return false;
  }

  if (segments.length === 1) {
    return true;
  }

  if (segments.length === 2 && second === 'card') {
    return true;
  }

  if (segments.length === 2 && second === 'opengraph-image') {
    return true;
  }

  if (segments.length === 3 && second === 'card' && third === 'opengraph-image') {
    return true;
  }

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicAsset(pathname) || ALLOWED_ROUTES.has(pathname) || isPublicProfilePath(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard/')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    const panel = DASHBOARD_PANEL_BY_PATH[pathname];
    if (panel) {
      url.searchParams.set('panel', panel);
    } else {
      url.search = '';
    }
    return NextResponse.redirect(url);
  }

  const url = request.nextUrl.clone();
  url.pathname = '/';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: '/:path*',
};
