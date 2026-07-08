import { siteConfig } from '@/config/site'
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

// TODO: [Action Required: replace the windows-logo placeholder below with real
// per-shortcut icon assets in Task 17]
const FOLDER_ICON = assetPaths.desktopIcons.windowsExplorer

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

// External links — these open directly in a new browser tab. The destinations
// are fork-config values (src/config/site.ts).
export const RIGHT_COLUMN_SHORTCUTS: StartMenuShortcut[] = siteConfig.externalLinks.map((link) => ({
  id: `sm-${link.title.toLowerCase().replace(/\s+/g, '-')}`,
  label: link.title,
  action: { type: 'openLink', url: link.url },
}))
