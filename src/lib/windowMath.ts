export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export function clampWindowPosition(candidate: Position, size: Size, viewport: Size): Position {
  const maxX = viewport.width - size.width
  const maxY = viewport.height - size.height
  return {
    x: Math.max(0, Math.min(candidate.x, maxX)),
    y: Math.max(0, Math.min(candidate.y, maxY)),
  }
}

/**
 * Clamp a candidate window size so it stays at/above the usable minimum and
 * never extends past the viewport's right/bottom edges given the window's
 * fixed top-left position (resize grows only the bottom-right corner).
 */
export function clampWindowSize(
  candidate: Size,
  position: Position,
  viewport: Size,
  minSize: Size
): Size {
  const maxWidth = viewport.width - position.x
  const maxHeight = viewport.height - position.y
  return {
    width: Math.max(minSize.width, Math.min(candidate.width, maxWidth)),
    height: Math.max(minSize.height, Math.min(candidate.height, maxHeight)),
  }
}
