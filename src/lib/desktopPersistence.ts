import z from 'zod'

import type { GridCell } from '@/store/slices/desktopSlice'
import type { WindowKind } from '@/store/slices/windowSlice'

/** Single owner of the desktop-layout persistence markers:
 *
 *    1. win7.windowSizes — last committed window size, keyed by window kind.
 *    2. win7.iconPositions — desktop-icon grid cell, keyed by icon id.
 *
 *  Both live in sessionStorage (survive reloads within the tab, end when the
 *  tab closes) and flow through Redux: useDesktopPersistence hydrates them
 *  into the slices at desktop boot and writes changes back. A malformed or
 *  tampered marker is evicted so the next read is clean — same contract as
 *  guestSession/adminSession. */

// Namespaced to prevent collisions with other sessionStorage consumers
// (browser extensions, embedded widgets).
const WINDOW_SIZES_KEY = 'win7.windowSizes'
const ICON_POSITIONS_KEY = 'win7.iconPositions'

const WindowSizesSchema = z.record(
  z.string(),
  z.object({ width: z.number(), height: z.number() })
)

const IconPositionsSchema = z.record(
  z.string(),
  z.object({ column: z.number(), row: z.number() })
)

export type PersistedWindowSizes = Partial<Record<WindowKind, { width: number; height: number }>>
export type PersistedIconPositions = Record<string, GridCell>

/** Reads and validates the persisted per-kind window sizes, if any. */
export function readWindowSizes(): PersistedWindowSizes | null {
  return readMarker(WINDOW_SIZES_KEY, WindowSizesSchema)
}

export function writeWindowSizes(sizes: PersistedWindowSizes): void {
  writeMarker(WINDOW_SIZES_KEY, sizes)
}

/** Reads and validates the persisted icon positions, if any. */
export function readIconPositions(): PersistedIconPositions | null {
  return readMarker(ICON_POSITIONS_KEY, IconPositionsSchema)
}

export function writeIconPositions(positions: PersistedIconPositions): void {
  writeMarker(ICON_POSITIONS_KEY, positions)
}

function readMarker<Schema extends z.ZodType>(
  key: string,
  schema: Schema
): z.infer<Schema> | null {
  if (typeof window === 'undefined') {
    return null
  }
  const raw = window.sessionStorage.getItem(key)
  if (!raw) {
    return null
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    window.sessionStorage.removeItem(key)
    return null
  }
  const validated = schema.safeParse(parsed)
  if (!validated.success) {
    window.sessionStorage.removeItem(key)
    return null
  }
  return validated.data
}

function writeMarker(key: string, value: unknown): void {
  if (typeof window === 'undefined') {
    return
  }
  window.sessionStorage.setItem(key, JSON.stringify(value))
}
