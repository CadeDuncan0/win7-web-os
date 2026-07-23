'use client'

/** Virtual icon grid with @dnd-kit drag-and-drop. Icons snap to a column-major
 *  grid on drop, with collision avoidance to the next free cell. */

import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { useEffect, useState } from 'react'
import { DesktopIcon } from '../DesktopIcon'
import styles from './IconGrid.module.css'
import { DEFAULT_APP_ICON, desktopIconId, type Application } from '@/config/applications'
import { useDesktopSensors } from '@/hooks/useDesktopSensors'
import {
  CELL_HEIGHT,
  CELL_WIDTH,
  GRID_PADDING,
  TASKBAR_RESERVE,
  gridCellToPixels,
  pixelsToGridCell,
  isCellOccupied,
  findNextFreeCell,
} from '@/lib/gridMath'
import { launchApplication } from '@/lib/launchApplication'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  registerIcon,
  setIconPosition,
  clearSelection,
  selectDesktopIcons,
  selectHiddenIconIds,
} from '@/store/slices/desktopSlice'

interface IconGridProps {
  /** Applications rendering a desktop icon (registry order = seed order). */
  apps: Application[]
  /** Fired on right-click anywhere on the desktop surface (viewport coords).
   *  `iconId` is set when the click landed on a desktop icon. */
  onContextMenu?: (position: { x: number; y: number }, iconId?: string) => void
}

export function IconGrid({ apps, onContextMenu }: IconGridProps) {
  // Pull hooks
  const dispatch = useAppDispatch()
  const sensors = useDesktopSensors()
  const desktopIcons = useAppSelector(selectDesktopIcons)
  const hiddenIconIds = useAppSelector(selectHiddenIconIds)

  useEffect(() => {
    apps.forEach((app, index) => {
      dispatch(
        registerIcon({
          id: desktopIconId(app.key),
          position: { column: 0, row: index },
          defaultPosition: { column: 0, row: index },
        })
      )
    })
  }, [dispatch, apps])

  const [gridBounds, setGridBounds] = useState({ maxColumns: 1, maxRows: 1 })

  useEffect(() => {
    const computeGridBounds = () => {
      const availableHeight = window.innerHeight - TASKBAR_RESERVE - GRID_PADDING * 2
      const availableWidth = window.innerWidth - GRID_PADDING * 2
      setGridBounds({
        maxColumns: Math.max(1, Math.floor(availableWidth / CELL_WIDTH)),
        maxRows: Math.max(1, Math.floor(availableHeight / CELL_HEIGHT)),
      })
    }
    computeGridBounds()
    window.addEventListener('resize', computeGridBounds)
    return () => window.removeEventListener('resize', computeGridBounds)
  }, [])

  // Drop handler: convert pixel delta → grid cell → clamp → collision check → dispatch
  const handleDragEnd = (event: DragEndEvent) => {
    const id = event.active.id.toString()
    const { delta } = event

    const icon = desktopIcons.find((i) => i.id === id)
    if (!icon) {
      return
    }

    const currentPixels = gridCellToPixels(icon.position)
    const newPixels = { x: currentPixels.x + delta.x, y: currentPixels.y + delta.y }

    let gridCell = pixelsToGridCell(newPixels.x, newPixels.y)

    // Clamp to grid bounds so an icon can never be dropped off-screen
    gridCell = {
      column: Math.max(0, Math.min(gridCell.column, gridBounds.maxColumns - 1)),
      row: Math.max(0, Math.min(gridCell.row, gridBounds.maxRows - 1)),
    }

    // Hidden icons free their cells, so a drop only collides with visible ones.
    const visibleIcons = desktopIcons.filter((i) => !hiddenIconIds.includes(i.id))
    if (isCellOccupied(gridCell, visibleIcons, id)) {
      gridCell = findNextFreeCell(gridCell, visibleIcons, id, gridBounds.maxRows)
    }

    dispatch(setIconPosition({ id, position: gridCell }))
  }

  // Only deselect when clicking the grid background itself, not a child icon
  const handleDeselect = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      dispatch(clearSelection())
    }
  }

  // The whole desktop surface (icons included) suppresses the browser menu and
  // opens the OS one — matching Win7, where no surface shows the native menu.
  // A right-click on an icon reports that icon's id so the menu can offer
  // icon-specific actions (e.g. "Hide icon").
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const iconId = (e.target as Element).closest('[data-icon-id]')?.getAttribute('data-icon-id')
    onContextMenu?.({ x: e.clientX, y: e.clientY }, iconId ?? undefined)
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div
        className={styles.grid}
        data-testid="icon-grid"
        onClick={handleDeselect}
        onContextMenu={handleContextMenu}
      >
        {apps.map((app) => (
          <DesktopIcon
            key={app.key}
            id={desktopIconId(app.key)}
            label={app.title}
            iconSrc={app.iconSrc ?? DEFAULT_APP_ICON}
            onOpen={() => dispatch(launchApplication(app.key))}
          />
        ))}
      </div>
    </DndContext>
  )
}
