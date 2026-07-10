import type { NextConfig } from 'next'

// Legacy/alias paths that resolve to the canonical OS route. Append here as
// more are needed — each entry becomes a temporary (307) redirect to /win7.
const legacyRedirects = ['/', '/hub', '/login', '/desktop']

// Optional subpath mount, e.g. '/desktop' to serve the app at
// example.com/desktop behind a rewrite zone. Empty = served at the domain root.
// Exposed to the browser as NEXT_PUBLIC_BASE_PATH so CSS url() assets can be
// prefixed to match (see src/lib/assetPaths.ts → cssAssetVars).
const basePath = process.env.BASE_PATH ?? ''

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone',
  devIndicators: false,
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  async redirects() {
    return legacyRedirects.map((source) => ({
      source,
      destination: '/win7',
      permanent: false,
    }))
  },
}

export default nextConfig
