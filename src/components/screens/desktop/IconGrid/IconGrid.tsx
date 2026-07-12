'use client'

/** Virtual icon grid with @dnd-kit drag-and-drop. Icons snap to a column-major
 *  grid on drop, with collision avoidance to the next free cell. */

import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { useEffect, useState } from 'react'
import { DesktopIcon } from '../DesktopIcon'
import { openWindowIfEnabled } from '../openWindowIfEnabled'
import type { WindowKey } from '../windowKeys'
import styles from './IconGrid.module.css'
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
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  registerIcon,
  setIconPosition,
  clearSelection,
  selectDesktopIcons,
} from '@/store/slices/desktopSlice'
import type { WindowKind } from '@/store/slices/windowSlice'

interface IconGridProps {
  icons: Array<{
    id: string
    label: string
    iconSrc: string
    windowKind: WindowKind
    windowTitle: string
    windowKey: WindowKey
    windowSize?: { width: number; height: number }
  }>
}

export function IconGrid({ icons: _icons }: IconGridProps) {
  // Pull hooks
  const dispatch = useAppDispatch()
  const sensors = useDesktopSensors()
  const desktopIcons = useAppSelector(selectDesktopIcons)

  useEffect(() => {
    _icons.forEach((iconDef, index) => {
      dispatch(
        registerIcon({
          id: iconDef.id,
          position: { column: 0, row: index },
          defaultPosition: { column: 0, row: index },
        })
      )
    })
  }, [dispatch, _icons])

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

    // If the target cell is taken, scan for the next free cell
    if (isCellOccupied(gridCell, desktopIcons, id)) {
      gridCell = findNextFreeCell(gridCell, desktopIcons, id, gridBounds.maxRows)
    }

    dispatch(setIconPosition({ id, position: gridCell }))
  }

  // Only deselect when clicking the grid background itself, not a child icon
  const handleDeselect = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      dispatch(clearSelection())
    }
  }
  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className={styles.grid} data-testid="icon-grid" onClick={handleDeselect}>
        {_icons.map((iconDef) => (
          <DesktopIcon
            key={iconDef.id}
            id={iconDef.id}
            label={iconDef.label}
            iconSrc={iconDef.iconSrc}
            onOpen={() =>
              dispatch(
                openWindowIfEnabled({
                  kind: iconDef.windowKind,
                  title: iconDef.windowTitle,
                  windowKey: iconDef.windowKey,
                  size: iconDef.windowSize,
                })
              )
            }
          />
        ))}
      </div>
    </DndContext>
  )
}
