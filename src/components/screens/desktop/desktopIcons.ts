import { WINDOW_KEYS, type WindowKey } from './windowKeys'
import { assetPaths } from '@/lib/assetPaths'
import type { WindowKind } from '@/store/slices/windowSlice'

export interface DesktopIconDefinition {
  id: string
  label: string
  iconSrc: string
  windowKind: WindowKind
  windowTitle: string
  /** Stable id used for the disabled-window switch and the openWindow gate. */
  windowKey: WindowKey
  /** Optional initial window geometry; omitted = windowSlice default. */
  windowSize?: { width: number; height: number }
  /** Hide this icon on the admin desktop (guest sessions still show it). */
  hideForAdmin?: boolean
  /** Hide this icon from guest sessions (guests cannot see or open it). */
  hideForGuest?: boolean
  /** When true, the icon is retired for everyone: it claims no grid cell and
   *  cannot launch its window. Independent of the site-wide window kill switch
   *  in disabledWindows — this drops just this launcher. */
  disabled?: boolean
}

const FOLDER_ICON = assetPaths.desktopIcons.folderWithDocuments

export const DESKTOP_ICONS: DesktopIconDefinition[] = [
  {
    id: 'icon-ie',
    label: 'Internet Explorer',
    iconSrc: assetPaths.desktopIcons.internetExplorer,
    windowKind: 'internet-explorer',
    windowTitle: 'Internet Explorer',
    windowKey: WINDOW_KEYS.internetExplorer,
  },
  {
    id: 'icon-welcome',
    label: 'Welcome',
    iconSrc: FOLDER_ICON,
    windowKind: 'welcome',
    windowTitle: 'Welcome',
    windowKey: WINDOW_KEYS.welcome,
  },
  {
    id: 'icon-getting-started',
    label: 'Getting Started',
    iconSrc: FOLDER_ICON,
    windowKind: 'internet-explorer',
    // Matches an IE page title, so the window opens directly on that page.
    windowTitle: 'Getting Started',
    windowKey: WINDOW_KEYS.gettingStarted,
  },
]
