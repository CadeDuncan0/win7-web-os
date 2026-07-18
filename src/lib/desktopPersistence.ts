import z from 'zod'

import type { GridCell } from '@/store/slices/desktopSlice'
import type { WindowKind } from '@/store/slices/windowSlice'

/** Single owner of the desktop-layout persistence markers:
 *
 *    1. win7.windowSizes — last committed window size, keyed by window kind.
 *    2. win7.windowPositions — last committed window position, keyed by window kind.
 *    3. win7.iconPositions — desktop-icon grid cell, keyed by icon id.
 *    4. win7.hiddenIcons — icon ids the user hid via the context menu.
 *    5. win7.removedNotifications — tray notification ids the user removed.
 *    6. win7.openNotification — the open balloon's id, so it reappears on reload.
 *
 *  All live in sessionStorage (survive reloads within the tab, end when the
 *  tab closes) and flow through Redux: useDesktopPersistence hydrates them
 *  into the slices at desktop boot and writes changes back. A malformed or
 *  tampered marker is evicted so the next read is clean — same contract as
 *  guestSession/adminSession. */

// Namespaced to prevent collisions with other sessionStorage consumers
// (browser extensions, embedded widgets).
const WINDOW_SIZES_KEY = 'win7.windowSizes'
const WINDOW_POSITIONS_KEY = 'win7.windowPositions'
const ICON_POSITIONS_KEY = 'win7.iconPositions'
const HIDDEN_ICONS_KEY = 'win7.hiddenIcons'
const REMOVED_NOTIFICATIONS_KEY = 'win7.removedNotifications'
const OPEN_NOTIFICATION_KEY = 'win7.openNotification'

const WindowSizesSchema = z.record(z.string(), z.object({ width: z.number(), height: z.number() }))

const WindowPositionsSchema = z.record(z.string(), z.object({ x: z.number(), y: z.number() }))

const IconPositionsSchema = z.record(z.string(), z.object({ column: z.number(), row: z.number() }))

const IdListSchema = z.array(z.string())

export type PersistedWindowSizes = Partial<Record<WindowKind, { width: number; height: number }>>
export type PersistedWindowPositions = Partial<Record<WindowKind, { x: number; y: number }>>
export type PersistedIconPositions = Record<string, GridCell>

/** Reads and validates the persisted per-kind window sizes, if any. */
export function readWindowSizes(): PersistedWindowSizes | null {
  return readMarker(WINDOW_SIZES_KEY, WindowSizesSchema)
}

export function writeWindowSizes(sizes: PersistedWindowSizes): void {
  writeMarker(WINDOW_SIZES_KEY, sizes)
}

/** Reads and validates the persisted per-kind window positions, if any. */
export function readWindowPositions(): PersistedWindowPositions | null {
  return readMarker(WINDOW_POSITIONS_KEY, WindowPositionsSchema)
}

export function writeWindowPositions(positions: PersistedWindowPositions): void {
  writeMarker(WINDOW_POSITIONS_KEY, positions)
}

/** Reads and validates the persisted icon positions, if any. */
export function readIconPositions(): PersistedIconPositions | null {
  return readMarker(ICON_POSITIONS_KEY, IconPositionsSchema)
}

export function writeIconPositions(positions: PersistedIconPositions): void {
  writeMarker(ICON_POSITIONS_KEY, positions)
}

/** Reads and validates the persisted hidden-icon ids, if any. */
export function readHiddenIcons(): string[] | null {
  return readMarker(HIDDEN_ICONS_KEY, IdListSchema)
}

export function writeHiddenIcons(ids: string[]): void {
  writeMarker(HIDDEN_ICONS_KEY, ids)
}

/** Reads and validates the persisted removed-notification ids, if any. */
export function readRemovedNotifications(): string[] | null {
  return readMarker(REMOVED_NOTIFICATIONS_KEY, IdListSchema)
}

export function writeRemovedNotifications(ids: string[]): void {
  writeMarker(REMOVED_NOTIFICATIONS_KEY, ids)
}

/** Reads and validates the persisted open-balloon id, if any. */
export function readOpenNotification(): string | null {
  return readMarker(OPEN_NOTIFICATION_KEY, z.string())
}

export function writeOpenNotification(id: string | null): void {
  if (id === null) {
    removeMarker(OPEN_NOTIFICATION_KEY)
  } else {
    writeMarker(OPEN_NOTIFICATION_KEY, id)
  }
}

function readMarker<Schema extends z.ZodType>(key: string, schema: Schema): z.infer<Schema> | null {
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

function removeMarker(key: string): void {
  if (typeof window === 'undefined') {
    return
  }
  window.sessionStorage.removeItem(key)
}
