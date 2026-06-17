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
    iconSrc: FOLDER_ICON,
    windowKind: 'internet-explorer',
    windowTitle: 'Resume',
  },
  {
    id: 'icon-projects',
    label: 'Projects',
    iconSrc: FOLDER_ICON,
    windowKind: 'internet-explorer',
    windowTitle: 'Projects',
  },
  {
    id: 'icon-welcome',
    label: 'Welcome',
    iconSrc: FOLDER_ICON,
    windowKind: 'welcome',
    windowTitle: 'Welcome',
  },
]
