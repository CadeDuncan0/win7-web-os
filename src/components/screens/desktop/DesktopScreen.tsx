'use client'

import { useMemo } from 'react'

import { Desktop } from '@/components/screens/desktop/Desktop'
import { DESKTOP_ICONS } from '@/components/screens/desktop/desktopIcons'
import { isWindowDisabled } from '@/components/screens/desktop/disabledWindows'
import { IconGrid } from '@/components/screens/desktop/IconGrid'
import { Taskbar } from '@/components/screens/desktop/Taskbar'
import { WindowManager } from '@/components/screens/desktop/WindowManager'
import { useDesktopPersistence } from '@/hooks/useDesktopPersistence'

export interface DesktopScreenProps {
  /** Server-derived admin flag — passed by the page so icons flagged
   *  hideForAdmin are filtered before first render (no flash, and the hidden
   *  icons never register grid cells). Guest is the complement: !isAdmin. */
  isAdmin?: boolean
}

/**
 * The full desktop composition. Rendered at the app root when the server sees
 * a valid session cookie (src/app/page.tsx).
 */
export function DesktopScreen({ isAdmin = false }: DesktopScreenProps) {
  useDesktopPersistence()

  // Windows turned off site-wide never register a grid cell, in any session;
  // the role then drops its own hidden icons. Guest is the complement of admin
  // (assume guest whenever !isAdmin), so it needs no separate flag. Memoized so
  // the array identity is stable across re-renders — it is a dependency of
  // IconGrid's registration effect.
  const visibleIcons = useMemo(() => {
    const availableIcons = DESKTOP_ICONS.filter(
      (icon) => !icon.disabled && !isWindowDisabled(icon.windowKey, isAdmin)
    )
    return isAdmin
      ? availableIcons.filter((icon) => !icon.hideForAdmin)
      : availableIcons.filter((icon) => !icon.hideForGuest)
  }, [isAdmin])

  return (
    <>
      <Desktop iconGrid={<IconGrid icons={visibleIcons} />} windowLayer={<WindowManager />} />
      <Taskbar />
    </>
  )
}
