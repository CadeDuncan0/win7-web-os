/** Sync guard between TypeScript layout constants and their CSS custom
 *  property counterparts in globals.css. The TypeScript constants are the
 *  canonical values; the CSS tokens exist so stylesheets can reference them.
 *  If this suite fails, one side changed without the other. */

import fs from 'node:fs'
import path from 'node:path'

import { CELL_WIDTH, CELL_HEIGHT, GRID_PADDING, TASKBAR_RESERVE } from './gridMath'
import { MIN_WINDOW_SIZE } from '@/store/slices/windowSlice'

const globalsCss = fs.readFileSync(path.join(process.cwd(), 'src', 'app', 'globals.css'), 'utf8')

function cssPxToken(name: string): number {
  const match = globalsCss.match(new RegExp(`${name}:\\s*(\\d+)px`))
  if (!match) {
    throw new Error(`Token ${name} not found in globals.css`)
  }
  return Number(match[1])
}

describe('design token ↔ TypeScript constant sync', () => {
  it('grid cell dimensions match --dsk-grid-cell-*', () => {
    expect(cssPxToken('--dsk-grid-cell-w')).toBe(CELL_WIDTH)
    expect(cssPxToken('--dsk-grid-cell-h')).toBe(CELL_HEIGHT)
  })

  it('grid padding matches --dsk-grid-padding', () => {
    expect(cssPxToken('--dsk-grid-padding')).toBe(GRID_PADDING)
  })

  it('taskbar reserve matches --dsk-taskbar-reserve', () => {
    expect(cssPxToken('--dsk-taskbar-reserve')).toBe(TASKBAR_RESERVE)
  })

  it('window minimum size matches --mw-min-*', () => {
    expect(cssPxToken('--mw-min-width')).toBe(MIN_WINDOW_SIZE.width)
    expect(cssPxToken('--mw-min-height')).toBe(MIN_WINDOW_SIZE.height)
  })
})
