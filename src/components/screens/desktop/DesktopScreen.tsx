'use client'

import { Desktop } from '@/components/screens/desktop/Desktop'
import { DESKTOP_ICONS } from '@/components/screens/desktop/desktopIcons'
import { IconGrid } from '@/components/screens/desktop/IconGrid'
import { Taskbar } from '@/components/screens/desktop/Taskbar'
import { WindowManager } from '@/components/screens/desktop/WindowManager'

/**
 * The full desktop composition. Rendered by /win7 (when the server sees a
 * valid session cookie) and by the /win7/desktop deep link.
 */
export function DesktopScreen() {
  return (
    <>
      <Desktop iconGrid={<IconGrid icons={DESKTOP_ICONS} />} windowLayer={<WindowManager />} />
      <Taskbar />
    </>
  )
}
