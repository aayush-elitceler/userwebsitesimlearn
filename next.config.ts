import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'reportal-media.s3.ap-south-1.amazonaws.com' },
      { protocol: 'https', hostname: 'simplelearntechbucket.s3.ap-south-1.amazonaws.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: 'http://35.154.108.96:3000/api/v1/:path*',
  //     },
  //   ];
  // },
};

export default nextConfig;
