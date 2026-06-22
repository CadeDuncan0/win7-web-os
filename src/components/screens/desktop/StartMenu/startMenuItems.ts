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
    id: 'sm-resume',
    label: 'Resume',
    iconSrc: FOLDER_ICON,
    action: { type: 'openWindow', kind: 'internet-explorer', title: 'Resume' },
  },
  {
    id: 'sm-projects',
    label: 'Projects',
    iconSrc: FOLDER_ICON,
    action: { type: 'openWindow', kind: 'internet-explorer', title: 'Projects' },
  },
]

// External links — these open directly in a new browser tab.
export const RIGHT_COLUMN_SHORTCUTS: StartMenuShortcut[] = [
  {
    id: 'sm-github',
    label: 'GitHub',
    action: { type: 'openLink', url: 'https://github.com/CadeDuncan0' },
  },
  {
    id: 'sm-linkedin',
    label: 'LinkedIn',
    action: { type: 'openLink', url: 'https://linkedin.com/in/cade-duncan' },
  },
  {
    id: 'sm-source',
    label: 'Source Code',
    action: { type: 'openLink', url: 'https://github.com/CadeDuncan0/PortfolioWebsite-Windows7' },
  },
]
