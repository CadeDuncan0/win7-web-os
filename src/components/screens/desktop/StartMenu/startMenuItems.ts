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

// TODO: [Action Required: replace placeholder icon paths with real assets in Task 17]

export const LEFT_COLUMN_SHORTCUTS: StartMenuShortcut[] = [
  {
    id: 'sm-resume',
    label: 'Resume',
    iconSrc: '/imgs/desktop/icons/resume.png',
    action: { type: 'openWindow', kind: 'internet-explorer', title: 'Resume' },
  },
  {
    id: 'sm-projects',
    label: 'Projects',
    iconSrc: '/imgs/desktop/icons/projects.png',
    action: { type: 'openWindow', kind: 'internet-explorer', title: 'Projects' },
  },
]

export const RIGHT_COLUMN_SHORTCUTS: StartMenuShortcut[] = [
  {
    id: 'sm-github',
    label: 'GitHub',
    iconSrc: '/imgs/desktop/icons/folder.png',
    action: { type: 'openWindow', kind: 'internet-explorer', title: 'GitHub' },
  },
  {
    id: 'sm-linkedin',
    label: 'LinkedIn',
    iconSrc: '/imgs/desktop/icons/folder.png',
    action: { type: 'openWindow', kind: 'internet-explorer', title: 'LinkedIn' },
  },
  {
    id: 'sm-source',
    label: 'Source Code',
    iconSrc: '/imgs/desktop/icons/folder.png',
    action: { type: 'openWindow', kind: 'internet-explorer', title: 'Source Code' },
  },
]

export const SIGN_OUT_ITEM: StartMenuShortcut = {
  id: 'sm-signout',
  label: 'Sign Out',
  iconSrc: '/imgs/desktop/icons/signout.png',
  action: { type: 'signOut' },
}
