
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        domains: ['reportal-media.s3.ap-south-1.amazonaws.com'],
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Permissions-Policy',
                        value: 'microphone=*',
                    },
                    {
                        key: 'Feature-Policy',
                        value: 'microphone *',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;