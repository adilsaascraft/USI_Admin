import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'usilmsin.s3.ap-northeast-1.amazonaws.com',
        pathname: '/**',
      },
    ],
  },

  turbopack: {},
}

export default nextConfig