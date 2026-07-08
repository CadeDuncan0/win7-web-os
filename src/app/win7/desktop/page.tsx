'use client'

import { Desktop } from '@/components/screens/desktop/Desktop'
import { DESKTOP_ICONS } from '@/components/screens/desktop/desktopIcons'
import { IconGrid } from '@/components/screens/desktop/IconGrid'
import { Taskbar } from '@/components/screens/desktop/Taskbar'
import { WindowManager } from '@/components/screens/desktop/WindowManager'

export default function DesktopPage() {
  return (
    <>
      <Desktop iconGrid={<IconGrid icons={DESKTOP_ICONS} />} windowLayer={<WindowManager />} />
      <Taskbar />
    </>
  )
}
