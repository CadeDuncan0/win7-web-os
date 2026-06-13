import type { WindowKind } from '@/store/slices/windowSlice'

export interface DesktopIconDefinition {
  id: string
  label: string
  iconSrc: string
  windowKind: WindowKind
  windowTitle: string
}

const PLACEHOLDER_ICON = '/imgs/login/windows-logo.png'

export const DESKTOP_ICONS: DesktopIconDefinition[] = [
  {
    id: 'icon-ie',
    label: 'Internet Explorer',
    iconSrc: '/imgs/windows7/assets/internetexplorer_logo.png',
    windowKind: 'internet-explorer',
    windowTitle: 'Internet Explorer',
  },
  {
    id: 'icon-resume',
    label: 'Resume',
    iconSrc: PLACEHOLDER_ICON,
    windowKind: 'internet-explorer',
    windowTitle: 'Resume',
  },
  {
    id: 'icon-projects',
    label: 'Projects',
    iconSrc: PLACEHOLDER_ICON,
    windowKind: 'internet-explorer',
    windowTitle: 'Projects',
  },
  {
    id: 'icon-welcome',
    label: 'Welcome',
    iconSrc: PLACEHOLDER_ICON,
    windowKind: 'welcome',
    windowTitle: 'Welcome',
  },
  {
    id: 'icon-about',
    label: 'About This PC',
    iconSrc: PLACEHOLDER_ICON,
    windowKind: 'about-this-pc',
    windowTitle: 'About This PC',
  },
]
