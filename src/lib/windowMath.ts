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
