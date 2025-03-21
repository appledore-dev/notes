import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        hostname: '*'
      }
    ]
  },
  compress: false,
  devIndicators: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
}

export default nextConfig
