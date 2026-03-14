import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  serverExternalPackages: ['mongoose'],
  outputFileTracingIncludes: {
    '/teacher-tools/tools/*/legacy/**': ['./legacy_tools/**/*'],
    '/teacher-tools/tools/*/common/**': ['./legacy_tools/**/*'],
    '/teacher-tools/tools/*/images/**': ['./legacy_tools/**/*'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

export default nextConfig
