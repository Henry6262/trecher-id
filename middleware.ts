import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ALLOWED_ROUTES = new Set(['/', '/leaderboard', '/dashboard']);
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicAsset(pathname) || ALLOWED_ROUTES.has(pathname)) {
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
