import { WINDOW_KEYS, type WindowKey } from '../windowKeys'
import { assetPaths } from '@/lib/assetPaths'
import type { WindowKind } from '@/store/slices/windowSlice'

/** Static shortcut registry for the Start Menu's two-column layout.
 *  Left column = program shortcuts (open in a window), right column = external
 *  links (open straight in a new tab — no Internet Explorer window). Each
 *  shortcut declares its action type so StartMenu can dispatch/route accordingly. */

export interface StartMenuShortcut {
  id: string
  label: string
  iconSrc?: string
  hideForAdmin?: boolean
  hideForGuest?: boolean
  /** When true, the shortcut is dropped from the menu for everyone (both
   *  columns) and its action can never fire. The one switch to retire an entry
   *  — including an external link whose window.open would otherwise bypass the
   *  window gate entirely. */
  disabled?: boolean
  action:
    | {
        type: 'openWindow'
        kind: WindowKind
        title: string
        /** Stable id used for the disabled-window switch and the openWindow gate. */
        windowKey: WindowKey
        /** Optional initial window geometry; omitted = windowSlice default. */
        size?: { width: number; height: number }
      }
    | { type: 'openLink'; url: string }
    | { type: 'signOut' }
}

export interface StartMenuTab {
  title: string
  url: string /* Destination opened directly in a new browser tab. */
  disabled?: boolean /* When true, the link is retired (see StartMenuShortcut.disabled). */
}

const FOLDER_ICON = assetPaths.desktopIcons.windowsExplorer

const RIGHT_COLUMN_TABS = [
  // External link retired site-wide: it leaves the sandbox via window.open, so
  // it is disabled here rather than gated. Flip to false to restore it.
  { title: 'Source Code', url: 'https://github.com/CadeDuncan0/win7-web-os', disabled: true },
] as StartMenuTab[]

export const LEFT_COLUMN_SHORTCUTS: StartMenuShortcut[] = [
  {
    id: 'sm-ie',
    label: 'Internet Explorer',
    iconSrc: assetPaths.desktopIcons.internetExplorer,
    action: {
      type: 'openWindow',
      kind: 'internet-explorer',
      title: 'Internet Explorer',
      windowKey: WINDOW_KEYS.internetExplorer,
    },
  },
  {
    id: 'sm-welcome',
    label: 'Welcome',
    iconSrc: FOLDER_ICON,
    action: {
      type: 'openWindow',
      kind: 'internet-explorer',
      title: 'Welcome',
      windowKey: WINDOW_KEYS.welcome,
    },
  },
  {
    id: 'sm-getting-started',
    label: 'Getting Started',
    iconSrc: FOLDER_ICON,
    action: {
      type: 'openWindow',
      kind: 'internet-explorer',
      title: 'Getting Started',
      windowKey: WINDOW_KEYS.gettingStarted,
    },
  },
]

// External links — these open directly in a new browser tab. Edit
// RIGHT_COLUMN_TABS above to change the destinations.
export const RIGHT_COLUMN_SHORTCUTS: StartMenuShortcut[] = RIGHT_COLUMN_TABS.map((link) => ({
  id: `sm-${link.title.toLowerCase().replace(/\s+/g, '-')}`,
  label: link.title,
  disabled: link.disabled,
  action: { type: 'openLink', url: link.url },
}))
