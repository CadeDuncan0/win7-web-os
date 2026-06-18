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
 * must be updated alongside this file.
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
