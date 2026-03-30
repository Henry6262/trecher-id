import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
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
    ],
    unoptimized: true,
  },
};

export default nextConfig;
