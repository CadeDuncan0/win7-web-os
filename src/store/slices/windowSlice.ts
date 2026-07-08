import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { RootState } from '@/store'

// ─── Constants ──────────────────────────────────────────────────────────────────

const DEFAULT_WINDOW_SIZE = { width: 640, height: 440 }
const DEFAULT_WINDOW_POSITION = { x: 80, y: 80 }
// Canonical minimum — the --mw-min-* tokens in globals.css are kept in sync
// by src/lib/designTokens.test.ts.
export const MIN_WINDOW_SIZE = { width: 240, height: 160 }

// ─── Types ──────────────────────────────────────────────────────────────────

// Discriminator for what content renders inside the window. The slice is
// content-agnostic — a registry component (Task 17) maps kind → React component.
// Add new kinds here as windows are introduced.
export type WindowKind = 'internet-explorer' | 'welcome'

export interface WindowGeometry {
  x: number
  y: number
  width: number
  height: number
}

export interface WindowInstance {
  id: string
  kind: WindowKind
  title: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  zIndex: number
  isMinimized: boolean
  isMaximized: boolean
  // null unless isMaximized === true. Snapshot of geometry taken at maximize
  // time so restore can return the window to its exact prior placement.
  prevGeometry: WindowGeometry | null
}

// Note: this interface is EXPORTED for test files only. Application code
// must go through the selectors below — never read state.window.* directly.
export interface WindowState {
  byId: Record<string, WindowInstance>
  ids: string[]
  zCounter: number
  nextIdSeed: number
}

// ─── Initial State ──────────────────────────────────────────────────────────
// Counters start at 0; first openWindow yields id 'win-1' and zIndex 1.
// Empty byId / empty ids — no windows are open at app boot.

const initialState: WindowState = {
  byId: {},
  ids: [],
  zCounter: 0,
  nextIdSeed: 0,
}

const windowSlice = createSlice({
  name: 'window',
  initialState,
  reducers: {
    // ── openWindow ────────────────────────────────────────────────────────
    // Payload: { kind: WindowKind; title: string; position?: {x,y}; size?: {w,h} }
    openWindow(
      state,
      action: PayloadAction<{
        kind: WindowKind
        title: string
        position?: { x: number; y: number }
        size?: { width: number; height: number }
      }>
    ) {
      //   1. Generate the id from state.nextIdSeed.
      state.nextIdSeed++
      const id = `win-${state.nextIdSeed}`
      //   2. Bump state.zCounter; the new window's zIndex = state.zCounter
      state.zCounter++
      const zIndex = state.zCounter
      //   3. Default position to { x: 80, y: 80 } if not provided.
      const position = action.payload.position ?? DEFAULT_WINDOW_POSITION
      //   4. Default size to { width: 640, height: 440 } if not provided.
      const size = action.payload.size ?? DEFAULT_WINDOW_SIZE
      //   5. isMinimized and isMaximized start false; prevGeometry starts null.
      const isMinimized = false
      const isMaximized = false
      const prevGeometry = null
      //   6. Insert into byId and append to ids (stable DOM order).
      state.byId[id] = {
        id,
        kind: action.payload.kind,
        title: action.payload.title,
        position,
        size,
        zIndex,
        isMinimized,
        isMaximized,
        prevGeometry,
      }
      state.ids.push(id)
    },

    // ── closeWindow ───────────────────────────────────────────────────────
    // Payload: { id: string }
    closeWindow(state, action: PayloadAction<{ id: string }>) {
      const window = state.byId[action.payload.id]
      //   1. If window does not exist, return immediately (idempotent).
      if (!window) {
        return
      }
      //   2. Delete window.
      delete state.byId[window.id]
      //   3. Remove id from state.ids (preserve order of remaining ids).
      state.ids = state.ids.filter((id) => id !== window.id)
    },

    // ── focusWindow ───────────────────────────────────────────────────────
    // Payload: { id: string }
    focusWindow(state, action: PayloadAction<{ id: string }>) {
      const window = state.byId[action.payload.id]
      //   1. If window does not exist, return (idempotent).
      if (!window) {
        return
      }
      //   2. If window is minimized, set isMinimized = false (restore-on-focus).
      //      Rationale: per Windows 7 semantics, focusing a minimized window
      //      from the taskbar both un-minimizes AND brings to front.
      if (window.isMinimized) {
        window.isMinimized = false
      }
      //   3. If the window is already at the top (zIndex === state.zCounter
      //      BEFORE the bump), skip the bump entirely to avoid churn during
      //      back-to-back clicks on the active window.
      if (window.zIndex === state.zCounter) {
        return
      }
      // 4. Bump zCounter and assign window.zIndex = state.zCounter.
      state.zCounter++
      window.zIndex = state.zCounter
    },

    // ── minimizeWindow ────────────────────────────────────────────────────
    // Payload: { id: string }
    minimizeWindow(state, action: PayloadAction<{ id: string }>) {
      const window = state.byId[action.payload.id]
      //   1. If window does not exist, return.
      if (!window) {
        return
      }
      //   2. Set isMinimized = true.
      window.isMinimized = true
    },

    // ── restoreWindow ─────────────────────────────────────────────────────
    // Payload: { id: string }
    restoreWindow(state, action: PayloadAction<{ id: string }>) {
      const window = state.byId[action.payload.id]
      //   1. If window does not exist, return.
      if (!window) {
        return
      }
      //   2. Set isMinimized = false.
      window.isMinimized = false
      //   3. Bump zCounter and assign window.zIndex = state.zCounter
      //      (restore brings to front — same as focusWindow's promotion).
      state.zCounter++
      window.zIndex = state.zCounter
    },

    // ── toggleMaximize ────────────────────────────────────────────────────
    // Payload: { id: string; viewport: { width: number; height: number } }
    toggleMaximize(
      state,
      action: PayloadAction<{ id: string; viewport: { width: number; height: number } }>
    ) {
      const window = state.byId[action.payload.id]
      //   1. If window does not exist, return.
      if (!window) {
        return
      }
      //   2. If isMaximized === false:
      //        - Snapshot the current geometry into prevGeometry.
      //        - Overwrite position to { x: 0, y: 0 }.
      //        - Overwrite size from action.payload.viewport (minus any taskbar
      //          height — but DO NOT subtract here; let the component layer
      //          pass a viewport that already excludes the taskbar).
      //        - Set isMaximized = true.
      if (!window.isMaximized) {
        window.prevGeometry = {
          x: window.position.x,
          y: window.position.y,
          width: window.size.width,
          height: window.size.height,
        }
        window.position = { x: 0, y: 0 }
        window.size = action.payload.viewport
        window.isMaximized = true
      }
      //   3. If isMaximized === true:
      //        - Restore position and size from prevGeometry.
      //        - Set prevGeometry = null.
      //        - Set isMaximized = false.
      else {
        window.position = {
          x: window.prevGeometry?.x ?? DEFAULT_WINDOW_POSITION.x,
          y: window.prevGeometry?.y ?? DEFAULT_WINDOW_POSITION.y,
        }
        window.size = {
          width: window.prevGeometry?.width ?? DEFAULT_WINDOW_SIZE.width,
          height: window.prevGeometry?.height ?? DEFAULT_WINDOW_SIZE.height,
        }
        window.prevGeometry = null
        window.isMaximized = false
      }
    },

    // ── moveWindow ────────────────────────────────────────────────────────
    // Payload: { id: string; x: number; y: number }
    moveWindow(state, action: PayloadAction<{ id: string; x: number; y: number }>) {
      const window = state.byId[action.payload.id]
      //   1. If window does not exist, return.
      if (!window) {
        return
      }
      //   2. If isMaximized === true, return (maximized windows can't be moved).
      if (window.isMaximized) {
        return
      }
      //   3. Set position.x and position.y from the payload as-is.
      //      DO NOT clamp here. Boundary clamping is the responsibility of the
      //      component drag handler (Task 11) which has access to the viewport.
      window.position = { x: action.payload.x, y: action.payload.y }
    },

    // ── resizeWindow ──────────────────────────────────────────────────────
    // Payload: { id: string; width: number; height: number }
    resizeWindow(state, action: PayloadAction<{ id: string; width: number; height: number }>) {
      const window = state.byId[action.payload.id]
      //   1. If window does not exist, return.
      if (!window) {
        return
      }
      //   2. If isMaximized === true, return.
      if (window.isMaximized) {
        return
      }
      //   3. Enforce a hard minimum (e.g., 240 × 160) — windows narrower than
      //      that have unusable chrome. Set size.width and size.height accordingly.
      window.size = {
        width: Math.max(action.payload.width, MIN_WINDOW_SIZE.width),
        height: Math.max(action.payload.height, MIN_WINDOW_SIZE.height),
      }
    },
  },
})

// ─── Selectors ──────────────────────────────────────────────────────────────

// Category 1 — primitive field access. No memoization needed.
export const selectZCounter = (state: RootState): number => {
  return state.window.zCounter
}

// Category 2 — O(1) lookup. Returns a stored reference; no new allocation.
// Higher-order selector: returns a *selector* parameterized by id.
// Usage in a component: useAppSelector(selectWindowById('win-3'))
export const selectWindowById =
  (id: string) =>
  (state: RootState): WindowInstance | undefined => {
    return state.window.byId[id]
  }

// Category 3 — derived computation. MUST be memoized with createSelector,
// otherwise every consumer re-renders on unrelated dispatches.
// Returns: WindowInstance[] in stable insertion order (state.ids order).
// Why insertion order, not z-order? DOM render order should be stable so React's
// keyed reconciliation does not move nodes. The visual stacking is handled by
// each window's style.zIndex, not by sibling order in the DOM.
export const selectOpenWindows = createSelector(
  [(state: RootState) => state.window.byId, (state: RootState) => state.window.ids],
  (byId, ids): WindowInstance[] => {
    return ids.map((id) => byId[id])
  }
)

// Returns: WindowInstance[] of windows where isMinimized === false.
// Used by the WindowManager renderer (Task 17) to decide what to mount.
// Minimized windows are intentionally unmounted from the DOM — their state
// survives in the slice; their components do not.
export const selectVisibleWindows = createSelector(
  [selectOpenWindows],
  (windows): WindowInstance[] => {
    return windows.filter((window) => !window.isMinimized)
  }
)

// Returns: the id of the window with the highest zIndex, ignoring minimized
// windows. Returns null if no non-minimized windows are open.
// Why ignore minimized? A minimized window is not visually on-screen, so it
// cannot be the active/top window even if its zIndex is the largest.
export const selectTopWindowId = createSelector(
  [selectVisibleWindows],
  (windows): string | null => {
    return (
      windows.reduce((max, window) => (window.zIndex > max.zIndex ? window : max), windows[0])
        ?.id ?? null
    )
  }
)

export const {
  openWindow,
  closeWindow,
  focusWindow,
  minimizeWindow,
  restoreWindow,
  toggleMaximize,
  moveWindow,
  resizeWindow,
} = windowSlice.actions
export default windowSlice.reducer
