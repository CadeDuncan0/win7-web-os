import { assetPaths } from '@/lib/assetPaths'
import type { WindowKind } from '@/store/slices/windowSlice'

/** Static shortcut registry for the Start Menu's two-column layout.
 *  Left column = program shortcuts, right column = folder/link shortcuts.
 *  Each shortcut declares its action type so StartMenu can dispatch accordingly. */

export interface StartMenuShortcut {
  id: string
  label: string
  iconSrc: string
  action: { type: 'openWindow'; kind: WindowKind; title: string } | { type: 'signOut' }
}

// TODO: [Action Required: replace the windows-logo placeholder below with real
// per-shortcut icon assets in Task 17]
const PLACEHOLDER_ICON = assetPaths.branding.windowsLogoPng

export const LEFT_COLUMN_SHORTCUTS: StartMenuShortcut[] = [
  {
    id: 'sm-resume',
    label: 'Resume',
    iconSrc: PLACEHOLDER_ICON,
    action: { type: 'openWindow', kind: 'internet-explorer', title: 'Resume' },
  },
  {
    id: 'sm-projects',
    label: 'Projects',
    iconSrc: PLACEHOLDER_ICON,
    action: { type: 'openWindow', kind: 'internet-explorer', title: 'Projects' },
  },
]

export const RIGHT_COLUMN_SHORTCUTS: StartMenuShortcut[] = [
  {
    id: 'sm-github',
    label: 'GitHub',
    iconSrc: PLACEHOLDER_ICON,
    action: { type: 'openWindow', kind: 'internet-explorer', title: 'GitHub' },
  },
  {
    id: 'sm-linkedin',
    label: 'LinkedIn',
    iconSrc: PLACEHOLDER_ICON,
    action: { type: 'openWindow', kind: 'internet-explorer', title: 'LinkedIn' },
  },
  {
    id: 'sm-source',
    label: 'Source Code',
    iconSrc: PLACEHOLDER_ICON,
    action: { type: 'openWindow', kind: 'internet-explorer', title: 'Source Code' },
  },
]

export const SIGN_OUT_ITEM: StartMenuShortcut = {
  id: 'sm-signout',
  label: 'Sign Out',
  iconSrc: PLACEHOLDER_ICON,
  action: { type: 'signOut' },
}
