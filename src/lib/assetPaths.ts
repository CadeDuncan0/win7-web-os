/**
 * Centralized registry of every `public/` asset path used by the app.
 *
 * Why this exists: asset paths were previously hardcoded as string literals
 * scattered across components, and a folder reorganization silently broke all
 * of them. Routing every reference through this module makes a future move or
 * rename a single edit here instead of a repo-wide search.
 *
 * Paths are root-absolute — `public/` is served at the site root, so
 * `public/assets/branding/windows-logo.png` resolves to
 * `/assets/branding/windows-logo.png`.
 *
 * NOTE: CSS cannot import TypeScript, so the `url(...)` values in
 * `globals.css` (backdrops, `--avatar-frame`) mirror these paths by hand and
 * must be updated alongside this file. When the app is mounted under a subpath
 * (see `cssAssetVars` below) those `url()` fallbacks are overridden at runtime.
 */
const ASSETS = '/assets'

export const assetPaths = {
  backgrounds: {
    login: `${ASSETS}/backgrounds/login.jpg`,
    desktop: `${ASSETS}/backgrounds/desktop.jpg`,
  },
  branding: {
    windowsLogoPng: `${ASSETS}/branding/windows-logo.png`,
    windowsLogoWebp: `${ASSETS}/branding/windows-logo.webp`,
  },
  desktopIcons: {
    internetExplorer: `${ASSETS}/desktop-icons/internet-explorer-logo.png`,
    windowsExplorer: `${ASSETS}/desktop-icons/windows-explorer.ico`,
    folderNested: `${ASSETS}/desktop-icons/folder-nested.ico`,
    folderWithDocuments: `${ASSETS}/desktop-icons/folder-with-documents.ico`,
  },
  /** Start orb. Mirrored by hand in globals.css `--tb-orb-img`. */
  taskbar: {
    startOrb: `${ASSETS}/desktop-icons/taskbar-startmenu.png`,
  },
  /** Directory of authentic Win7 user-tile avatars (see lib/userIcons.ts). */
  accountIcons: {
    dir: `${ASSETS}/account-icons`,
    guest: `${ASSETS}/account-icons/guest.bmp`,
    user: `${ASSETS}/account-icons/user.bmp`,
    border: `${ASSETS}/account-icon-border.png`,
  },
} as const

/**
 * Optional subpath the app is mounted under (e.g. `/desktop` when served at
 * cadeduncan.com/desktop via a Vercel rewrite zone). Empty for a standalone
 * deployment at the domain root. Kept in sync with `basePath` in
 * `next.config.ts` — both derive from the same env var.
 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/**
 * CSS `url()` custom properties that point at `public/` assets.
 *
 * Next.js prefixes `next/image` sources and framework assets with `basePath`
 * automatically, but absolute paths inside CSS `url()` are emitted verbatim —
 * so under a subpath mount they resolve against the domain root and 404. The
 * root layout spreads these onto `<html>` as inline styles, which override the
 * `:root` fallbacks in `globals.css` (those remain correct at the root and for
 * Storybook, where `BASE_PATH` is empty and the values are identical).
 *
 * The keys must match the hand-authored `url(...)` variables in `globals.css`.
 */
export function cssAssetVars(): Record<string, string> {
  return {
    '--logon-backdrop': `url('${BASE_PATH}${assetPaths.backgrounds.login}')`,
    '--desktop-backdrop': `url('${BASE_PATH}${assetPaths.backgrounds.desktop}')`,
    '--avatar-frame': `url('${BASE_PATH}${assetPaths.accountIcons.border}')`,
    '--tb-orb-img': `url('${BASE_PATH}${assetPaths.taskbar.startOrb}')`,
  }
}

/**
 * Prefixes a root-absolute `public/` path with the configured BASE_PATH.
 * Required for plain <img>/<iframe> srcs, anchor hrefs, and fetch() URLs —
 * unlike router navigations and next/image, raw element URLs are not
 * basePath-aware and would resolve against the domain root under a subpath
 * mount.
 */
export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`
}
