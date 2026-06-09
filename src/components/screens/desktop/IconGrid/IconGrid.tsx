'use client'

/** Virtual icon grid with @dnd-kit drag-and-drop. Icons snap to a column-major
 *  grid on drop, with collision avoidance to the next free cell. */

import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { useEffect, useState } from 'react'
import { DesktopIcon } from '../DesktopIcon'
import styles from './IconGrid.module.css'
import { useDesktopSensors } from '@/hooks/useDesktopSensors'
import {
  CELL_HEIGHT,
  GRID_PADDING,
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
import { openWindow, type WindowKind } from '@/store/slices/windowSlice'

// Must stay in sync with --dsk-taskbar-reserve in globals.css
const TASKBAR_RESERVE = 40

interface IconGridProps {
  icons: Array<{
    id: string
    label: string
    iconSrc: string
    windowKind: WindowKind
    windowTitle: string
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

  const [maxRows, setMaxRows] = useState(1)

  useEffect(() => {
    const computeMaxRows = () => {
      const availableHeight = window.innerHeight - TASKBAR_RESERVE - GRID_PADDING * 2
      setMaxRows(Math.floor(availableHeight / CELL_HEIGHT))
    }
    computeMaxRows()
    window.addEventListener('resize', computeMaxRows)
    return () => window.removeEventListener('resize', computeMaxRows)
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

    // Clamp to grid bounds
    gridCell = {
      column: Math.max(0, gridCell.column),
      row: Math.max(0, Math.min(gridCell.row, maxRows - 1)),
    }

    // If the target cell is taken, scan for the next free cell
    if (isCellOccupied(gridCell, desktopIcons, id)) {
      gridCell = findNextFreeCell(gridCell, desktopIcons, id, maxRows)
    }

    dispatch(setIconPosition({ ...icon, position: gridCell }))
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
                openWindow({
                  kind: iconDef.windowKind,
                  title: iconDef.windowTitle,
                })
              )
            }
          />
        ))}
      </div>
    </DndContext>
  )
}
