/**
 * Single source of truth for windows that are turned off site-wide.
 *
 * A window whose key is listed here is removed from EVERY entry point — the
 * desktop icon grid, the Start Menu, and the openWindow gate alike — so the
 * user can neither see nor open it in any location. This is the one switch to
 * flip: add a window's key to turn it off everywhere; remove it to restore full
 * access. Keys (not display titles) are matched, so renaming a window's title
 * never silently re-enables it.
 */
import type { WindowKey } from './windowKeys'

// To disable a window, add its key from WINDOW_KEYS (windowKeys.ts) below, e.g.
// WINDOW_KEYS.welcome — import { WINDOW_KEYS } when you do.
export const DISABLED_WINDOWS_GUEST: ReadonlySet<WindowKey> = new Set<WindowKey>([])

export const DISABLED_WINDOWS_ADMIN: ReadonlySet<WindowKey> = new Set<WindowKey>([])

/** True when the window with this key is turned off everywhere. */
export function isWindowDisabled(key: WindowKey, isAdmin?: boolean): boolean {
  return isAdmin ? DISABLED_WINDOWS_ADMIN.has(key) : DISABLED_WINDOWS_GUEST.has(key)
}
