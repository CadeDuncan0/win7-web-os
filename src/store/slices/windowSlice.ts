import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { RootState } from '@/store'
import { clearSession } from '@/store/slices/sessionSlice'

// ─── Constants ──────────────────────────────────────────────────────────────────

const DEFAULT_WINDOW_SIZE = { width: 880, height: 640 }
const DEFAULT_WINDOW_POSITION = { x: 80, y: 80 }
export const MIN_WINDOW_SIZE = { width: 240, height: 160 }

// ─── Types ──────────────────────────────────────────────────────────────────

// Discriminator for what content renders inside the window (taskbar grouping,
// per-kind size/position persistence). The slice is content-agnostic — plain
// string. Kind values are declared once, in the WindowApp descriptor each app
// module under components/apps/ exports; registry records reference the
// descriptor, so kinds are enforced where they are declared, never here.
export type WindowKind = string

export interface WindowGeometry {
  x: number
  y: number
  width: number
  height: number
}

// The serializable projection of an open window — just enough to reopen it.
// Geometry is intentionally omitted: a restored window pulls its size/position
// from the per-kind maps. Persisted per role by useDesktopPersistence.
export interface PersistableWindow {
  kind: WindowKind
  appKey: string
  title: string
  isMinimized: boolean
  isMaximized: boolean
}

export interface WindowInstance {
  id: string
  kind: WindowKind
  // Application registry key (config/applications.ts). Kept as a plain string
  // so the slice stays content-agnostic — WindowManager resolves it to a
  // component at render time.
  appKey: string
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
  // Last committed size per window kind — a reopened window of that kind
  // restores it. Hydrated from sessionStorage at desktop boot and written
  // back on change by useDesktopPersistence.
  sizeByKind: Partial<Record<WindowKind, { width: number; height: number }>>
  // Last committed position per window kind — a reopened window of that kind
  // restores it. Hydrated from sessionStorage at desktop boot and written
  // back on change by useDesktopPersistence.
  positionByKind: Partial<Record<WindowKind, { x: number; y: number }>>
  // Aero Peek: true while the Show Desktop button is hovered — open windows
  // render as bare glass sheets (WindowWrapper reads this flag).
  isPeeking: boolean
}

// ─── Initial State ──────────────────────────────────────────────────────────
// Counters start at 0; first openWindow yields id 'win-1' and zIndex 1.
// Empty byId / empty ids — no windows are open at app boot.

const initialState: WindowState = {
  byId: {},
  ids: [],
  zCounter: 0,
  nextIdSeed: 0,
  sizeByKind: {},
  positionByKind: {},
  isPeeking: false,
}

const windowSlice = createSlice({
  name: 'window',
  initialState,
  reducers: {
    // ── openWindow ────────────────────────────────────────────────────────
    // Payload: { kind: WindowKind; appKey: string; title: string;
    //            position?: {x,y}; size?: {w,h} }
    openWindow(
      state,
      action: PayloadAction<{
        kind: WindowKind
        appKey: string
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
      //   3. Position precedence mirrors size: last committed position for
      //      this kind (restores the user's placement on reopen) → caller-
      //      provided position → the module default. Copied so byId never
      //      aliases the positionByKind entry.
      const position = {
        ...(state.positionByKind[action.payload.kind] ??
          action.payload.position ??
          DEFAULT_WINDOW_POSITION),
      }
      //   4. Size precedence: last committed size for this kind (restores the
      //      user's sizing on reopen) → caller-provided initial size → the
      //      module default. Copied so byId never aliases the sizeByKind entry.
      const size = {
        ...(state.sizeByKind[action.payload.kind] ?? action.payload.size ?? DEFAULT_WINDOW_SIZE),
      }
      //   5. isMinimized and isMaximized start false; prevGeometry starts null.
      const isMinimized = false
      const isMaximized = false
      const prevGeometry = null
      //   6. Insert into byId and append to ids (stable DOM order).
      state.byId[id] = {
        id,
        kind: action.payload.kind,
        appKey: action.payload.appKey,
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

    // ── minimizeAll ───────────────────────────────────────────────────────
    // No payload. The Show Desktop button: every open window minimizes; each
    // window's state (geometry, z-order) survives for restore-on-focus.
    minimizeAll(state) {
      state.ids.forEach((id) => {
        state.byId[id].isMinimized = true
      })
    },

    // ── setPeek ───────────────────────────────────────────────────────────
    // Payload: boolean. Aero Peek — dispatched on Show Desktop button
    // hover-in/out; open windows keep rendering, WindowWrapper just swaps
    // them to the glass-sheet treatment while true.
    setPeek(state, action: PayloadAction<boolean>) {
      state.isPeeking = action.payload
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
      //   4. Remember the committed position for this kind so the next window
      //      of the same kind reopens at it.
      state.positionByKind[window.kind] = { ...window.position }
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
      //   4. Remember the committed size for this kind so the next window of
      //      the same kind (and reloads, via persistence) reopens at it.
      state.sizeByKind[window.kind] = { ...window.size }
    },

    // ── hydrateWindowSizes ────────────────────────────────────────────────
    // Payload: the persisted per-kind size map. Dispatched once at desktop
    // boot (useDesktopPersistence) before any window opens.
    hydrateWindowSizes(
      state,
      action: PayloadAction<Partial<Record<WindowKind, { width: number; height: number }>>>
    ) {
      state.sizeByKind = action.payload
    },

    // ── hydrateWindowPositions ────────────────────────────────────────────
    // Payload: the persisted per-kind position map. Dispatched once at desktop
    // boot (useDesktopPersistence) before any window opens.
    hydrateWindowPositions(
      state,
      action: PayloadAction<Partial<Record<WindowKind, { x: number; y: number }>>>
    ) {
      state.positionByKind = action.payload
    },

    // ── hydrateOpenWindows ────────────────────────────────────────────────
    // Payload: the persisted open-window set + the current viewport. Dispatched
    // once at desktop boot (useDesktopPersistence), AFTER the size/position maps
    // so each restored window pulls its own per-kind geometry. Reopens each
    // entry exactly as openWindow would; a maximized entry is rebuilt against the
    // passed viewport (the reducer has no DOM access of its own). Guarded to a
    // clean desktop so a StrictMode remount can't double-open the set.
    hydrateOpenWindows(
      state,
      action: PayloadAction<{
        windows: PersistableWindow[]
        viewport: { width: number; height: number }
      }>
    ) {
      if (state.ids.length > 0) {
        return
      }
      action.payload.windows.forEach((persisted) => {
        state.nextIdSeed++
        const id = `win-${state.nextIdSeed}`
        state.zCounter++
        const position = { ...(state.positionByKind[persisted.kind] ?? DEFAULT_WINDOW_POSITION) }
        const size = { ...(state.sizeByKind[persisted.kind] ?? DEFAULT_WINDOW_SIZE) }
        const instance: WindowInstance = {
          id,
          kind: persisted.kind,
          appKey: persisted.appKey,
          title: persisted.title,
          position,
          size,
          zIndex: state.zCounter,
          isMinimized: persisted.isMinimized,
          isMaximized: false,
          prevGeometry: null,
        }
        // Maximize stores the pre-maximize geometry so Restore returns there, and
        // fills the window to the viewport — mirrors toggleMaximize.
        if (persisted.isMaximized) {
          instance.prevGeometry = { ...position, width: size.width, height: size.height }
          instance.position = { x: 0, y: 0 }
          instance.size = { ...action.payload.viewport }
          instance.isMaximized = true
        }
        state.byId[id] = instance
        state.ids.push(id)
      })
    },
  },

  extraReducers: (builder) => {
    // Sign-out clears the live window set AND the remembered per-kind geometry so
    // the next account starts with a bare desktop; each role's own windows and
    // geometry are restored from its namespaced sessionStorage markers at desktop
    // boot (useDesktopPersistence). The open set must reset here too — it lives
    // only in Redux, which survives the router.refresh() a role switch triggers,
    // so without this the previous account's windows would linger on-screen.
    builder.addCase(clearSession, (state) => {
      state.byId = {}
      state.ids = []
      state.zCounter = 0
      state.nextIdSeed = 0
      state.sizeByKind = {}
      state.positionByKind = {}
      state.isPeeking = false
    })
  },
})

// ─── Selectors ──────────────────────────────────────────────────────────────

// Category 1 — primitive field access. No memoization needed.
export const selectZCounter = (state: RootState): number => {
  return state.window.zCounter
}

// Category 1 — primitive field access. No memoization needed.
export const selectIsPeeking = (state: RootState): boolean => {
  return state.window.isPeeking
}

// Category 2 — returns the stored reference; consumed by useDesktopPersistence
// to change-detect (by identity) and write the map through to sessionStorage.
export const selectWindowSizes = (
  state: RootState
): Partial<Record<WindowKind, { width: number; height: number }>> => {
  return state.window.sizeByKind
}

// Category 2 — returns the stored reference; consumed by useDesktopPersistence
// to change-detect (by identity) and write the map through to sessionStorage.
export const selectWindowPositions = (
  state: RootState
): Partial<Record<WindowKind, { x: number; y: number }>> => {
  return state.window.positionByKind
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

// Category 3 — derived array; consumed by useDesktopPersistence to change-detect
// (by identity) and write the open set through to sessionStorage. Memoized on
// selectOpenWindows, so it only recomputes when a window is opened/closed or a
// tracked field changes — not on unrelated dispatches. Shape mirrors
// PersistedOpenWindow so it round-trips through the marker unchanged.
export const selectPersistableWindows = createSelector(
  [selectOpenWindows],
  (windows): PersistableWindow[] =>
    windows.map((window) => ({
      kind: window.kind,
      appKey: window.appKey,
      title: window.title,
      isMinimized: window.isMinimized,
      isMaximized: window.isMaximized,
    }))
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
  minimizeAll,
  setPeek,
  restoreWindow,
  toggleMaximize,
  moveWindow,
  resizeWindow,
  hydrateWindowSizes,
  hydrateWindowPositions,
  hydrateOpenWindows,
} = windowSlice.actions
export default windowSlice.reducer
