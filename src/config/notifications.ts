/**
 * Tray notification registry — each entry renders a persistent icon in the
 * system tray (left of the clock) whose balloon opens on click. Forks edit
 * this list to announce their own news (releases, tips, easter eggs).
 *
 * Nothing auto-opens and nothing auto-dismisses: the visitor opens a balloon
 * by clicking its tray icon, and closes it by clicking the ✕, the action
 * link, another notification, or anywhere outside. Right-clicking a tray icon
 * offers "Remove notification", which retires the icon for the session.
 */
import type { WindowKey } from './applications'
import { assetPaths } from '@/lib/assetPaths'

export interface NotificationDefinition {
  /** Stable id — also dedupes seeding, so each notification exists once. */
  id: string
  title: string
  message: string
  /** Tray icon + balloon-header glyph. Default: the Win7 info icon. */
  iconSrc?: string
  /** Optional link rendered under the message; opens an application through
   *  the same gate as every other launcher. */
  action?: { label: string; appKey: WindowKey }
  /** When true, the notification is retired and never seeded. */
  disabled?: boolean
}

export const NOTIFICATIONS: NotificationDefinition[] = [
  {
    id: 'welcome',
    title: 'Welcome to win7-web-os!',
    message:
      'You are on a Windows 7 desktop running in your browser. Double-click an icon to explore.',
    action: { label: 'Take the tour', appKey: 'welcome' },
  },
  {
    id: 'version-1-4',
    title: 'Version 1.4 released!',
    message:
      'Applications registry, right-click menus, tray notifications, and a Show Desktop button.',
    iconSrc: assetPaths.systemIcons.windowsFlag,
    action: { label: 'Getting Started guide', appKey: 'getting-started' },
  },
  {
    // Example fork announcement — flip `disabled` to false to use it.
    id: 'fork-tip',
    title: 'Make it yours',
    message: 'Fork the template and edit applications.ts to put your own apps on this desktop.',
    action: { label: 'Getting Started guide', appKey: 'getting-started' },
    disabled: true,
  },
]

/** Notifications that actually seed the tray — disabled entries drop out once
 *  here so no renderer ever sees them. */
export const ENABLED_NOTIFICATIONS: NotificationDefinition[] = NOTIFICATIONS.filter(
  (notification) => !notification.disabled
)
