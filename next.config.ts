import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    domains: ['reportal-media.s3.ap-south-1.amazonaws.com'],
  },
};

export default nextConfig;
