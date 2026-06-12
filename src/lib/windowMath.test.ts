import { clampWindowPosition } from './windowMath'

const VIEWPORT = { width: 1024, height: 728 }
const WINDOW_SIZE = { width: 400, height: 300 }

describe('clampWindowPosition', () => {
  it('passes an in-bounds position through unchanged', () => {
    expect(clampWindowPosition({ x: 100, y: 50 }, WINDOW_SIZE, VIEWPORT)).toEqual({
      x: 100,
      y: 50,
    })
  })

  it('clamps x to 0 when dragged past the left edge', () => {
    expect(clampWindowPosition({ x: -50, y: 100 }, WINDOW_SIZE, VIEWPORT)).toEqual({
      x: 0,
      y: 100,
    })
  })

  it('clamps x to viewport.width - size.width on the right', () => {
    expect(clampWindowPosition({ x: 5000, y: 100 }, WINDOW_SIZE, VIEWPORT)).toEqual({
      x: 624,
      y: 100,
    })
  })

  it('clamps y to 0 at the top', () => {
    expect(clampWindowPosition({ x: 100, y: -200 }, WINDOW_SIZE, VIEWPORT)).toEqual({
      x: 100,
      y: 0,
    })
  })

  it('clamps y to viewport.height - size.height at the bottom', () => {
    expect(clampWindowPosition({ x: 100, y: 5000 }, WINDOW_SIZE, VIEWPORT)).toEqual({
      x: 100,
      y: 428,
    })
  })

  it('pins to top-left when the window exceeds the viewport', () => {
    const oversized = { width: 2000, height: 2000 }
    expect(clampWindowPosition({ x: 500, y: 500 }, oversized, VIEWPORT)).toEqual({ x: 0, y: 0 })
  })
})
