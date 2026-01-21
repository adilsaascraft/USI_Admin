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
  
  webpack(config) {
    // SVG as React component support
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    })
    return config
  },

  turbopack: {},
}

export default nextConfig