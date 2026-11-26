import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [
      { source: '/comunidad', destination: '/' },
      { source: '/comunidad/:path*', destination: '/:path*' },
    ]
  },
}

export default nextConfig
