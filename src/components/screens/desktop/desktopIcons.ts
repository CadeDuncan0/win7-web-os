import { assetPaths } from '@/lib/assetPaths'
import type { WindowKind } from '@/store/slices/windowSlice'

export interface DesktopIconDefinition {
  id: string
  label: string
  iconSrc: string
  windowKind: WindowKind
  windowTitle: string
}

const FOLDER_ICON = assetPaths.desktopIcons.folderWithDocuments

export const DESKTOP_ICONS: DesktopIconDefinition[] = [
  {
    id: 'icon-ie',
    label: 'Internet Explorer',
    iconSrc: assetPaths.desktopIcons.internetExplorer,
    windowKind: 'internet-explorer',
    windowTitle: 'Internet Explorer',
  },
  {
    id: 'icon-resume',
    label: 'Resume',
    iconSrc: FOLDER_ICON, // replace with pdf icon
    windowKind: 'internet-explorer',
    windowTitle: 'Resume',
  },
  {
    id: 'icon-projects',
    label: 'Projects',
    iconSrc: FOLDER_ICON, // replace with IE shortcut icon or create a new Windows Explorer window and put projects there
    windowKind: 'internet-explorer',
    windowTitle: 'Projects',
  },
]
