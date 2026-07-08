import type { NextConfig } from 'next'

// Legacy/alias paths that resolve to the canonical OS route. Append here as
// more are needed — each entry becomes a temporary (307) redirect to /win7.
const legacyRedirects = ['/', '/hub', '/login', '/desktop']

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone',
  devIndicators: false,
  async redirects() {
    return legacyRedirects.map((source) => ({
      source,
      destination: '/win7',
      permanent: false,
    }))
  },
}

export default nextConfig
