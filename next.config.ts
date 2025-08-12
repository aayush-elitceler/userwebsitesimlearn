import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    domains: [
      'reportal-media.s3.ap-south-1.amazonaws.com',
      'simplelearntechbucket.s3.ap-south-1.amazonaws.com',
    ],
  },
  eslint: {
    // Ignore ESLint errors during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during production builds
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
