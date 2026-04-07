import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Providers } from '@/components/providers';
import { LenisSmooth } from '@/components/lenis-provider';
import './globals.css';

function getMetadataBase(): URL {
  const rawUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    'http://localhost:3000';

  return new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: 'Web3Me — Your Web3 Bio Link',
  description: 'Linktree for crypto traders. Verified on-chain trading performance.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
      <body className="antialiased min-h-screen">
        <LenisSmooth />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
