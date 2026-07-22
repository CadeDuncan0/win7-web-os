'use client'

import { useMemo, useState } from 'react'

import { ContextMenu, type ContextMenuItem } from '@/components/shell/ContextMenu'
import { Desktop } from '@/components/shell/Desktop'
import { IconGrid } from '@/components/shell/IconGrid'
import { Taskbar } from '@/components/shell/Taskbar'
import { WindowManager } from '@/components/shell/WindowManager'
import { desktopIconApps, desktopIconId } from '@/config/applications'
import { useDesktopPersistence } from '@/hooks/useDesktopPersistence'
import { gridMaxRows } from '@/lib/gridMath'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  arrangeIcons,
  resetGuestPositions,
  selectHiddenIconIds,
  setIconHidden,
} from '@/store/slices/desktopSlice'

export interface DesktopScreenProps {
  /** Server-derived admin flag — passed by the page so apps flagged
   *  hideForAdmin are filtered before first render (no flash, and the hidden
   *  icons never register grid cells). Guest is the complement: !isAdmin. */
  isAdmin?: boolean
}

/**
 * The full desktop composition. Rendered at the app root when the server sees
 * a valid session cookie (src/app/page.tsx).
 */
export function DesktopScreen({ isAdmin = false }: DesktopScreenProps) {
  useDesktopPersistence(isAdmin)
  const dispatch = useAppDispatch()
  const hiddenIconIds = useAppSelector(selectHiddenIconIds)
  const [desktopMenu, setDesktopMenu] = useState<{
    x: number
    y: number
    iconId?: string
  } | null>(null)

  // Applications hidden from this role never register a grid cell. Memoized so
  // the array identity is stable across re-renders — it is a dependency of
  // IconGrid's registration effect.
  const iconApps = useMemo(() => desktopIconApps(isAdmin), [isAdmin])

  // User-hidden icons stay registered (their cells survive for re-showing) but
  // don't render.
  const visibleApps = useMemo(
    () => iconApps.filter((app) => !hiddenIconIds.includes(desktopIconId(app.key))),
    [iconApps, hiddenIconIds]
  )

  // Icon-specific action, present only when the right-click landed on one.
  const menuIconId = desktopMenu?.iconId
  const desktopMenuItems: ContextMenuItem[] = [
    ...(menuIconId
      ? [
          {
            label: 'Hide icon',
            onSelect: () =>
              dispatch(setIconHidden({ id: menuIconId, hidden: true, maxRows: gridMaxRows() })),
          },
        ]
      : []),
    {
      label: 'Show icons',
      // Every enabled desktop icon, checked when currently shown; clicking
      // toggles its user-hidden state.
      submenu: iconApps.map((app) => {
        const iconId = desktopIconId(app.key)
        const hidden = hiddenIconIds.includes(iconId)
        return {
          label: app.title,
          checked: !hidden,
          onSelect: () =>
            dispatch(setIconHidden({ id: iconId, hidden: !hidden, maxRows: gridMaxRows() })),
        }
      }),
    },
    {
      label: 'Sort icons',
      onSelect: () =>
        dispatch(
          arrangeIcons({
            ids: [...visibleApps]
              .sort((a, b) => a.title.localeCompare(b.title))
              .map((app) => desktopIconId(app.key)),
            maxRows: gridMaxRows(),
          })
        ),
    },
    {
      label: 'Reset icons',
      onSelect: () => dispatch(resetGuestPositions()),
    },
  ]

  return (
    <>
      <Desktop
        iconGrid={
          <IconGrid
            apps={visibleApps}
            onContextMenu={(position, iconId) => setDesktopMenu({ ...position, iconId })}
          />
        }
        windowLayer={<WindowManager />}
        overlay={
          desktopMenu && (
            <ContextMenu
              items={desktopMenuItems}
              position={desktopMenu}
              onClose={() => setDesktopMenu(null)}
              ariaLabel="Desktop context menu"
            />
          )
        }
      />
      <Taskbar />
    </>
  )
}
