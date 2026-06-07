import type { DesktopIcon, GridCell } from '@/store/slices/desktopSlice'

export const CELL_WIDTH = 75
export const CELL_HEIGHT = 80
export const GRID_PADDING = 12

// TODO: [Action Required: implement grid-cell-to-pixel conversion] - 3 min
//   x = cell.column * CELL_WIDTH + GRID_PADDING
//   y = cell.row * CELL_HEIGHT + GRID_PADDING
export function gridCellToPixels(_cell: GridCell): { x: number; y: number } {
  throw new Error('Not implemented')
}

// TODO: [Action Required: implement pixel-to-grid-cell conversion] - 3 min
//   column = Math.round((x - GRID_PADDING) / CELL_WIDTH)
//   row    = Math.round((y - GRID_PADDING) / CELL_HEIGHT)
//   Clamp both to >= 0.
export function pixelsToGridCell(_x: number, _y: number): GridCell {
  throw new Error('Not implemented')
}

// TODO: [Action Required: implement cell occupancy check] - 3 min
//   Return true if any icon (except excludeId) occupies the target cell.
export function isCellOccupied(
  _cell: GridCell,
  _icons: DesktopIcon[],
  _excludeId?: string
): boolean {
  throw new Error('Not implemented')
}

// TODO: [Action Required: implement next-free-cell scan] - 5 min
//   Starting from startCell, scan forward in column-first order:
//     row + 1 → if row >= maxRows, column + 1 and row = 0
//   Return the first cell where isCellOccupied is false.
//   If startCell itself is free, return it immediately.
export function findNextFreeCell(
  _startCell: GridCell,
  _icons: DesktopIcon[],
  _excludeId: string,
  _maxRows: number
): GridCell {
  throw new Error('Not implemented')
}
