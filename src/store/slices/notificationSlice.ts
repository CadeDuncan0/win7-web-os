import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { RootState } from '@/store'
import { clearSession } from '@/store/slices/sessionSlice'

// ─── Types ──────────────────────────────────────────────────────────────────

// A tray notification. Everything here is serializable — no timers exist
// anywhere: balloons open on tray-icon click and close only on user action.
// The optional action is stored as a registry key + label (plain strings) so
// the slice stays content-agnostic, mirroring windowSlice.appKey.
export interface TrayNotification {
  id: string
  title: string
  message: string
  /** Tray icon + balloon-header glyph; the renderer falls back to the info icon. */
  iconSrc?: string
  /** Link text rendered under the message; requires actionAppKey. */
  actionLabel?: string
  /** Application registry key the link opens (via the launch gate). */
  actionAppKey?: string
}

// Note: EXPORTED for test files only. Application code goes through the
// selectors below — never read state.notification.* directly.
export interface NotificationState {
  // Registry-seeded, in registry order — each non-removed item renders a
  // persistent tray icon.
  items: TrayNotification[]
  // Ids the user removed via the tray icon's context menu (the runtime
  // "disabled" flag). Removed items keep their slot in `items` but render
  // nothing. Persisted per role by useDesktopPersistence when the role's
  // NotificationData flag is on; with it off, removals live only here, so a
  // reload restores every notification.
  removedIds: string[]
  // The notification whose balloon is open; null when none. One balloon at a
  // time (Win7 behavior) — opening another replaces it.
  openId: string | null
}

// ─── Initial State ──────────────────────────────────────────────────────────

const initialState: NotificationState = {
  items: [],
  removedIds: [],
  openId: null,
}

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    // ── seedNotifications ─────────────────────────────────────────────────
    // Payload: the registry's enabled notifications. Adds unknown ids only
    // (idempotent against double-dispatch, e.g. StrictMode remounts).
    seedNotifications(state, action: PayloadAction<TrayNotification[]>) {
      action.payload.forEach((notification) => {
        if (!state.items.some((item) => item.id === notification.id)) {
          state.items.push(notification)
        }
      })
    },

    // ── openNotification ──────────────────────────────────────────────────
    // Payload: { id: string }. Opens that notification's balloon, replacing
    // any other open balloon. Unknown or removed ids are ignored.
    openNotification(state, action: PayloadAction<{ id: string }>) {
      const exists = state.items.some((item) => item.id === action.payload.id)
      if (!exists || state.removedIds.includes(action.payload.id)) {
        return
      }
      state.openId = action.payload.id
    },

    // ── closeNotification ─────────────────────────────────────────────────
    // Closes the open balloon (✕, action link, outside click). The tray icon
    // survives — closing is not removing.
    closeNotification(state) {
      state.openId = null
    },

    // ── removeNotification ────────────────────────────────────────────────
    // Payload: { id: string }. The tray icon's context-menu action: retires
    // the notification (its icon disappears; its balloon closes if open).
    removeNotification(state, action: PayloadAction<{ id: string }>) {
      if (!state.removedIds.includes(action.payload.id)) {
        state.removedIds.push(action.payload.id)
      }
      if (state.openId === action.payload.id) {
        state.openId = null
      }
    },

    // ── hydrateRemovedNotifications ───────────────────────────────────────
    // Payload: the persisted removed-id list. Dispatched once at desktop boot
    // (useDesktopPersistence).
    hydrateRemovedNotifications(state, action: PayloadAction<string[]>) {
      state.removedIds = action.payload
      if (state.openId !== null && state.removedIds.includes(state.openId)) {
        state.openId = null
      }
    },

    // ── hydrateOpenNotification ───────────────────────────────────────────
    // Payload: the persisted open-balloon id. Dispatched once at desktop boot
    // (useDesktopPersistence) so a balloon left open reappears on reload. The
    // item may not be seeded yet — the selector resolves it once it is. A
    // since-removed id is ignored (mirrors the guard in the removed hydrator,
    // so the two are order-independent).
    hydrateOpenNotification(state, action: PayloadAction<string>) {
      if (!state.removedIds.includes(action.payload)) {
        state.openId = action.payload
      }
    },
  },

  extraReducers: (builder) => {
    // Sign-out clears removals and the open balloon so the next account starts
    // clean; each role's own removals are restored from sessionStorage at desktop
    // boot (useDesktopPersistence) when its NotificationData flag is on.
    builder.addCase(clearSession, (state) => {
      state.removedIds = []
      state.openId = null
    })
  },
})

// ─── Selectors ──────────────────────────────────────────────────────────────

// Category 3 — derived array (filter allocates). Memoized so tray icons don't
// re-render on unrelated dispatches.
export const selectTrayNotifications = createSelector(
  [
    (state: RootState) => state.notification.items,
    (state: RootState) => state.notification.removedIds,
  ],
  (items, removedIds): TrayNotification[] => {
    return items.filter((item) => !removedIds.includes(item.id))
  }
)

// Category 2 — resolved lookup returning a stored reference (or undefined).
export const selectOpenNotification = (state: RootState): TrayNotification | undefined => {
  return state.notification.openId !== null
    ? state.notification.items.find((item) => item.id === state.notification.openId)
    : undefined
}

// Category 2 — returns the stored reference; consumed by useDesktopPersistence
// to change-detect (by identity) and write the list through to sessionStorage.
export const selectRemovedNotificationIds = (state: RootState): string[] => {
  return state.notification.removedIds
}

// Category 1 — primitive field; consumed by useDesktopPersistence to persist
// the open balloon so it reappears on reload.
export const selectOpenNotificationId = (state: RootState): string | null => {
  return state.notification.openId
}

export const {
  seedNotifications,
  openNotification,
  closeNotification,
  removeNotification,
  hydrateRemovedNotifications,
  hydrateOpenNotification,
} = notificationSlice.actions
export default notificationSlice.reducer
