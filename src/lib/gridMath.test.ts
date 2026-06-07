// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
import type { DesktopIcon, GridCell } from '@/store/slices/desktopSlice'

import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
  findNextFreeCell,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
  gridCellToPixels,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
  isCellOccupied,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
  pixelsToGridCell,
} from './gridMath'

// TODO: [Action Required: implement all test cases below] - 15 min

describe('gridCellToPixels', () => {
  // { column: 0, row: 0 } → { x: 12, y: 12 }
  it.todo('converts origin cell to GRID_PADDING offset')

  // { column: 1, row: 2 } → { x: 87, y: 172 }
  it.todo('converts non-origin cell to correct pixel position')
})

describe('pixelsToGridCell', () => {
  // (12, 12) → { column: 0, row: 0 }
  it.todo('converts exact cell-origin pixels to grid cell')

  // (87, 172) → { column: 1, row: 2 }
  it.todo('converts non-origin pixels to correct grid cell')

  // (49, 12) → { column: 0, row: 0 } — 0.49 rounds to 0
  it.todo('rounds to nearest cell when between cells')

  // negative values → { column: 0, row: 0 }
  it.todo('clamps negative pixel values to column 0, row 0')
})

describe('isCellOccupied', () => {
  it.todo('returns true when an icon occupies the target cell')

  it.todo('returns false when excludeId matches the icon at that cell')

  it.todo('returns false when no icon occupies the target cell')
})

describe('findNextFreeCell', () => {
  it.todo('returns startCell when it is free')

  it.todo('skips occupied cells and returns the next free one')

  it.todo('wraps from bottom of column to top of next column')
})
