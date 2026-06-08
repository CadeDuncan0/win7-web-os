import { findNextFreeCell, gridCellToPixels, isCellOccupied, pixelsToGridCell } from './gridMath'
import type { DesktopIcon } from '@/store/slices/desktopSlice'

function makeIcon(id: string, column: number, row: number): DesktopIcon {
  return {
    id,
    position: { column, row },
    defaultPosition: { column, row },
  }
}

describe('gridCellToPixels', () => {
  it('converts origin cell to GRID_PADDING offset', () => {
    expect(gridCellToPixels({ column: 0, row: 0 })).toEqual({ x: 12, y: 12 })
  })

  it('converts non-origin cell to correct pixel position', () => {
    expect(gridCellToPixels({ column: 1, row: 2 })).toEqual({ x: 87, y: 172 })
  })
})

describe('pixelsToGridCell', () => {
  it('converts exact cell-origin pixels to grid cell', () => {
    expect(pixelsToGridCell(12, 12)).toEqual({ column: 0, row: 0 })
  })

  it('converts non-origin pixels to correct grid cell', () => {
    expect(pixelsToGridCell(87, 172)).toEqual({ column: 1, row: 2 })
  })

  it('rounds to nearest cell when between cells', () => {
    expect(pixelsToGridCell(49, 12)).toEqual({ column: 0, row: 0 })
  })

  it('clamps negative pixel values to column 0, row 0', () => {
    expect(pixelsToGridCell(-100, -50)).toEqual({ column: 0, row: 0 })
  })
})

describe('isCellOccupied', () => {
  const icons = [makeIcon('a', 0, 0), makeIcon('b', 1, 2)]

  it('returns true when an icon occupies the target cell', () => {
    expect(isCellOccupied({ column: 0, row: 0 }, icons)).toBe(true)
  })

  it('returns false when excludeId matches the icon at that cell', () => {
    expect(isCellOccupied({ column: 0, row: 0 }, icons, 'a')).toBe(false)
  })

  it('returns false when no icon occupies the target cell', () => {
    expect(isCellOccupied({ column: 3, row: 3 }, icons)).toBe(false)
  })
})

describe('findNextFreeCell', () => {
  const maxRows = 5

  it('returns startCell when it is free', () => {
    const icons = [makeIcon('a', 0, 0)]
    expect(findNextFreeCell({ column: 0, row: 1 }, icons, 'b', maxRows)).toEqual({
      column: 0,
      row: 1,
    })
  })

  it('skips occupied cells and returns the next free one', () => {
    const icons = [makeIcon('a', 0, 0), makeIcon('b', 0, 1)]
    expect(findNextFreeCell({ column: 0, row: 0 }, icons, 'x', maxRows)).toEqual({
      column: 0,
      row: 2,
    })
  })

  it('wraps from bottom of column to top of next column', () => {
    const icons = [makeIcon('a', 0, 3), makeIcon('b', 0, 4), makeIcon('c', 1, 0)]
    expect(findNextFreeCell({ column: 0, row: 3 }, icons, 'x', maxRows)).toEqual({
      column: 1,
      row: 1,
    })
  })
})
