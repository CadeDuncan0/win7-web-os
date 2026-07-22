/** Coordinate math for the desktop icon grid.
 *  Icons live in a column-major grid; these functions convert between
 *  grid cells (column, row) and pixel offsets (x, y). */

import type { DesktopIcon, GridCell } from '@/store/slices/desktopSlice'

// Canonical layout constants. Their CSS custom property counterparts in
// globals.css (--dsk-grid-cell-w, --dsk-grid-cell-h, --dsk-grid-padding,
// --dsk-taskbar-reserve) are kept in sync by src/lib/designTokens.test.ts.
export const CELL_WIDTH = 75
export const CELL_HEIGHT = 80
export const GRID_PADDING = 12
export const TASKBAR_RESERVE = 40

// Rows that fit above the taskbar at the current viewport height — the bound
// arrangeIcons wraps at. Reads window, so call from client event handlers only,
// never during render/SSR. Mirrors IconGrid's live gridBounds.maxRows.
export function gridMaxRows(): number {
  const availableHeight = window.innerHeight - TASKBAR_RESERVE - GRID_PADDING * 2
  return Math.max(1, Math.floor(availableHeight / CELL_HEIGHT))
}

export function gridCellToPixels(cell: GridCell): { x: number; y: number } {
  return {
    x: cell.column * CELL_WIDTH + GRID_PADDING,
    y: cell.row * CELL_HEIGHT + GRID_PADDING,
  }
}

export function pixelsToGridCell(x: number, y: number): GridCell {
  return {
    column: Math.max(0, Math.round((x - GRID_PADDING) / CELL_WIDTH)),
    row: Math.max(0, Math.round((y - GRID_PADDING) / CELL_HEIGHT)),
  }
}

export function isCellOccupied(cell: GridCell, icons: DesktopIcon[], excludeId?: string): boolean {
  return icons.some(
    (icon) =>
      icon.id !== excludeId &&
      icon.position.column === cell.column &&
      icon.position.row === cell.row
  )
}

// Scans column-major (down rows, then next column) to match Win7's icon flow
export function findNextFreeCell(
  startCell: GridCell,
  icons: DesktopIcon[],
  excludeId: string,
  maxRows: number
): GridCell {
  let { column, row } = startCell

  while (true) {
    if (!isCellOccupied({ column, row }, icons, excludeId)) {
      return { column, row }
    }
    row += 1
    if (row >= maxRows) {
      row = 0
      column += 1
    }
  }
}
