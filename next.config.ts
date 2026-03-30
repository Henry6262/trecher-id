import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '*.helius-rpc.com' },
      { protocol: 'https', hostname: 'unavatar.io' },
      { protocol: 'https', hostname: '*.unavatar.io' },
    ],
  },
};

export default nextConfig;
