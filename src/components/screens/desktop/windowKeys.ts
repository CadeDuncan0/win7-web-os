/**
 * Stable identifiers for each launchable window. A window key is decoupled from
 * the display title (which also drives IE routing), so the disabled-window
 * switch and the openWindow gate key off an id that never changes when copy
 * does. Add a key here when you add a launchable window.
 */
export const WINDOW_KEYS = {
  internetExplorer: 'window-internet-explorer',
  welcome: 'window-welcome',
  gettingStarted: 'window-getting-started',
} as const

export type WindowKey = (typeof WINDOW_KEYS)[keyof typeof WINDOW_KEYS]
