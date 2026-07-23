import z from 'zod'

import type { GridCell } from '@/store/slices/desktopSlice'
import type { WindowKind } from '@/store/slices/windowSlice'

/** Single owner of the desktop-layout persistence markers, each namespaced by
 *  role (win7.<role>.*) so a guest never inherits the admin's layout, and vice
 *  versa:
 *
 *    1. win7.<role>.windowSizes — last committed window size, keyed by window kind.
 *    2. win7.<role>.windowPositions — last committed window position, keyed by window kind.
 *    3. win7.<role>.iconPositions — desktop-icon grid cell, keyed by icon id.
 *    4. win7.<role>.hiddenIcons — icon ids the user hid via the context menu.
 *    5. win7.<role>.removedNotifications — tray notification ids the user removed.
 *    6. win7.<role>.openNotification — the open balloon's id, so it reappears on reload.
 *    7. win7.<role>.openWindows — the open-window set, so a same-role sign-in restores it.
 *
 *  All live in sessionStorage (survive reloads within the tab, end when the
 *  tab closes) and flow through Redux: useDesktopPersistence hydrates them
 *  into the slices at desktop boot and writes changes back. A malformed or
 *  tampered marker is evicted so the next read is clean — same contract as
 *  guestSession/adminSession. */

export type SessionRole = 'guest' | 'admin'

// Keys carry two prefixes: `win7.` avoids collisions with other sessionStorage
// consumers (browser extensions, embedded widgets), and the role segment keeps
// each account's layout separate so neither inherits the other's on sign-in.
const markerKey = (role: SessionRole, marker: string): string => `win7.${role}.${marker}`

const WindowSizesSchema = z.record(z.string(), z.object({ width: z.number(), height: z.number() }))

const WindowPositionsSchema = z.record(z.string(), z.object({ x: z.number(), y: z.number() }))

const IconPositionsSchema = z.record(z.string(), z.object({ column: z.number(), row: z.number() }))

const IdListSchema = z.array(z.string())

// Only the facts needed to reopen a window: its kind/app + minimized/maximized
// state. Geometry is not stored here — a reopened window pulls its size and
// position from the per-kind windowSizes/windowPositions markers.
const OpenWindowsSchema = z.array(
  z.object({
    kind: z.string(),
    appKey: z.string(),
    title: z.string(),
    isMinimized: z.boolean(),
    isMaximized: z.boolean(),
  })
)

export type PersistedWindowSizes = Partial<Record<WindowKind, { width: number; height: number }>>
export type PersistedWindowPositions = Partial<Record<WindowKind, { x: number; y: number }>>
export type PersistedIconPositions = Record<string, GridCell>
export type PersistedOpenWindow = z.infer<typeof OpenWindowsSchema>[number]

/** Reads and validates the persisted per-kind window sizes, if any. */
export function readWindowSizes(role: SessionRole): PersistedWindowSizes | null {
  return readMarker(markerKey(role, 'windowSizes'), WindowSizesSchema)
}

export function writeWindowSizes(role: SessionRole, sizes: PersistedWindowSizes): void {
  writeMarker(markerKey(role, 'windowSizes'), sizes)
}

/** Reads and validates the persisted per-kind window positions, if any. */
export function readWindowPositions(role: SessionRole): PersistedWindowPositions | null {
  return readMarker(markerKey(role, 'windowPositions'), WindowPositionsSchema)
}

export function writeWindowPositions(role: SessionRole, positions: PersistedWindowPositions): void {
  writeMarker(markerKey(role, 'windowPositions'), positions)
}

/** Reads and validates the persisted icon positions, if any. */
export function readIconPositions(role: SessionRole): PersistedIconPositions | null {
  return readMarker(markerKey(role, 'iconPositions'), IconPositionsSchema)
}

export function writeIconPositions(role: SessionRole, positions: PersistedIconPositions): void {
  writeMarker(markerKey(role, 'iconPositions'), positions)
}

/** Reads and validates the persisted hidden-icon ids, if any. */
export function readHiddenIcons(role: SessionRole): string[] | null {
  return readMarker(markerKey(role, 'hiddenIcons'), IdListSchema)
}

export function writeHiddenIcons(role: SessionRole, ids: string[]): void {
  writeMarker(markerKey(role, 'hiddenIcons'), ids)
}

/** Reads and validates the persisted removed-notification ids, if any. */
export function readRemovedNotifications(role: SessionRole): string[] | null {
  return readMarker(markerKey(role, 'removedNotifications'), IdListSchema)
}

export function writeRemovedNotifications(role: SessionRole, ids: string[]): void {
  writeMarker(markerKey(role, 'removedNotifications'), ids)
}

/** Reads and validates the persisted open-balloon id, if any. */
export function readOpenNotification(role: SessionRole): string | null {
  return readMarker(markerKey(role, 'openNotification'), z.string())
}

export function writeOpenNotification(role: SessionRole, id: string | null): void {
  if (id === null) {
    removeMarker(markerKey(role, 'openNotification'))
  } else {
    writeMarker(markerKey(role, 'openNotification'), id)
  }
}

/** Reads and validates the persisted open-window set, if any. */
export function readOpenWindows(role: SessionRole): PersistedOpenWindow[] | null {
  return readMarker(markerKey(role, 'openWindows'), OpenWindowsSchema)
}

export function writeOpenWindows(role: SessionRole, windows: PersistedOpenWindow[]): void {
  writeMarker(markerKey(role, 'openWindows'), windows)
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
