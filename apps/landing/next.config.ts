import type { NextConfig } from 'next';

const config: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img1.wsimg.com' },
    ],
  },
};

export default config;
