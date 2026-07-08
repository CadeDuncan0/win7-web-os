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
  action:
    | { type: 'openWindow'; kind: WindowKind; title: string }
    | { type: 'openLink'; url: string }
    | { type: 'signOut' }
}

export interface StartMenuTab {
  title: string
  url: string /* Destination opened directly in a new browser tab. */
}

const FOLDER_ICON = assetPaths.desktopIcons.windowsExplorer

const RIGHT_COLUMN_TABS = [
  { title: 'Source Code', url: 'https://github.com/CadeDuncan0/win7-web-os' },
] as StartMenuTab[]

export const LEFT_COLUMN_SHORTCUTS: StartMenuShortcut[] = [
  {
    id: 'sm-ie',
    label: 'Internet Explorer',
    iconSrc: assetPaths.desktopIcons.internetExplorer,
    action: { type: 'openWindow', kind: 'internet-explorer', title: 'Internet Explorer' },
  },
  {
    id: 'sm-getting-started',
    label: 'Getting Started',
    iconSrc: FOLDER_ICON,
    action: { type: 'openWindow', kind: 'internet-explorer', title: 'Getting Started' },
  },
]

// External links — these open directly in a new browser tab. Edit
// RIGHT_COLUMN_TABS above to change the destinations.
export const RIGHT_COLUMN_SHORTCUTS: StartMenuShortcut[] = RIGHT_COLUMN_TABS.map((link) => ({
  id: `sm-${link.title.toLowerCase().replace(/\s+/g, '-')}`,
  label: link.title,
  action: { type: 'openLink', url: link.url },
}))
