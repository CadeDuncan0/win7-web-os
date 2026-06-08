'use client'

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
import { DndContext, type DragEndEvent } from '@dnd-kit/core'
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
import { useEffect, useMemo } from 'react'

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
import { DesktopIcon } from '../DesktopIcon'
//import styles from './IconGrid.module.css'
//import { useDesktopSensors } from '@/hooks/useDesktopSensors'
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
  CELL_HEIGHT,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
  GRID_PADDING,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
  gridCellToPixels,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
  pixelsToGridCell,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
  isCellOccupied,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
  findNextFreeCell,
} from '@/lib/gridMath'
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
  registerIcon,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
  setIconPosition,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
  clearSelection,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
  selectDesktopIcons,
} from '@/store/slices/desktopSlice'
import type { WindowKind } from '@/store/slices/windowSlice'

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
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

// TODO: [Action Required: implement the IconGrid component] - 25 min
//
//   1. Pull hooks:
//      - const dispatch = useAppDispatch()
//      - const sensors = useDesktopSensors()
//      - const desktopIcons = useAppSelector(selectDesktopIcons)
//
//   2. On mount, register icons that aren't already in Redux:
//      useEffect(() => {
//        icons.forEach((iconDef, index) => {
//          dispatch(registerIcon({
//            id: iconDef.id,
//            position: { column: 0, row: index },
//            defaultPosition: { column: 0, row: index },
//          }))
//        })
//      }, [])
//
//   3. Compute maxRows from viewport height:
//      const maxRows = useMemo(() => {
//        const availableHeight = window.innerHeight - TASKBAR_RESERVE - GRID_PADDING * 2
//        return Math.floor(availableHeight / CELL_HEIGHT)
//      }, [])
//
//   4. Implement handleDragEnd(event: DragEndEvent):
//      - Extract active.id and delta from event
//      - Find icon in desktopIcons by id
//      - Compute new pixel position = current pixels + delta
//      - Snap to nearest grid cell via pixelsToGridCell
//      - Clamp to grid bounds (0 to maxRows - 1)
//      - If cell is occupied, find next free via findNextFreeCell
//      - Dispatch setIconPosition with the resolved cell
//
//   5. Implement handleDeselect on the wrapping div:
//      - onClick: if e.target === e.currentTarget, dispatch clearSelection()
//
//   6. Render:
//      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
//        <div className={styles.grid} onClick={handleDeselect}>
//          {icons.map((iconDef) => (
//            <DesktopIcon
//              key={iconDef.id}
//              id={iconDef.id}
//              label={iconDef.label}
//              iconSrc={iconDef.iconSrc}
//              onOpen={() => dispatch(openWindow({
//                kind: iconDef.windowKind,
//                title: iconDef.windowTitle,
//              }))}
//            />
//          ))}
//        </div>
//      </DndContext>
export function IconGrid({ icons: _icons }: IconGridProps) {
  throw new Error('Not implemented')
}
