import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@farcaster/mini-app-solana': false,
    };
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '*.helius-rpc.com' },
      { protocol: 'https', hostname: 'unavatar.io' },
      { protocol: 'https', hostname: '*.unavatar.io' },
      { protocol: 'https', hostname: 'arweave.net' },
      { protocol: 'https', hostname: '*.arweave.net' },
      { protocol: 'https', hostname: 'ipfs.io' },
      { protocol: 'https', hostname: '*.ipfs.io' },
      { protocol: 'https', hostname: 'nftstorage.link' },
      { protocol: 'https', hostname: '*.nftstorage.link' },
      { protocol: 'https', hostname: 'cf-ipfs.com' },
      { protocol: 'https', hostname: 'gateway.pinata.cloud' },
      { protocol: 'https', hostname: 'img.fotofolio.xyz' },
      { protocol: 'https', hostname: 'bafkreia*' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
