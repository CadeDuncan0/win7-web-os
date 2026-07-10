import type { NextConfig } from 'next'

// Legacy/alias paths that resolve to the canonical OS route. Append here as
// more are needed — each entry becomes a temporary (307) redirect to /win7.
// The root path is not in this list: it is *rewritten* (not redirected) to
// /win7 below, so the URL the visitor entered at — the domain root, or the
// mount point under a BASE_PATH deployment — never changes in the address bar.
const legacyRedirects = ['/hub', '/login', '/desktop']

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
  async rewrites() {
    // Serve the OS at the root (and, with basePath set, at the mount point —
    // source and destination are auto-prefixed) without touching the URL.
    return [{ source: '/', destination: '/win7' }]
  },
}

export default nextConfig
