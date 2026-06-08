import reducer, {
  openWindow,
  closeWindow,
  focusWindow,
  minimizeWindow,
  restoreWindow,
  toggleMaximize,
  moveWindow,
  resizeWindow,
  selectZCounter,
  selectWindowById,
  selectOpenWindows,
  selectTopWindowId,
  selectVisibleWindows,
  type WindowInstance,
  type WindowState,
} from './windowSlice'
import type { RootState } from '@/store'

const INITIAL: WindowState = {
  byId: {},
  ids: [],
  zCounter: 0,
  nextIdSeed: 0,
}

// Selectors only read state.window, so the rest of RootState can be a stub.
const rootFrom = (window: WindowState): RootState => ({ window }) as unknown as RootState

// Opens a single window through the reducer and hands back both the resulting
// state and the freshly-created instance (resolved via the last inserted id, so
// the helper is agnostic to the id-naming scheme).
const openOne = (
  state: WindowState = INITIAL,
  overrides: Partial<Parameters<typeof openWindow>[0]> = {}
): { state: WindowState; window: WindowInstance } => {
  const next = reducer(state, openWindow({ kind: 'welcome', title: 'Welcome', ...overrides }))
  const id = next.ids[next.ids.length - 1]
  return { state: next, window: next.byId[id] }
}

// Opens three windows (A, B, C) in insertion order; C ends up on top.
const openABC = (): WindowState => {
  let state = reducer(INITIAL, openWindow({ kind: 'welcome', title: 'A' }))
  state = reducer(state, openWindow({ kind: 'welcome', title: 'B' }))
  state = reducer(state, openWindow({ kind: 'welcome', title: 'C' }))
  return state
}

describe('windowSlice', () => {
  describe('initial state', () => {
    it('matches the empty registry shape', () => {
      expect(reducer(undefined, { type: '@@INIT' })).toEqual(INITIAL)
    })
  })

  describe('openWindow', () => {
    it('assigns sequential ids starting at win-1', () => {
      const state = openABC()
      expect(state.ids).toEqual(['win-1', 'win-2', 'win-3'])
    })

    it('places each new window on top of the stack', () => {
      const state = openABC()
      const [a, b, c] = state.ids.map((id) => state.byId[id])
      expect(b.zIndex).toBeGreaterThan(a.zIndex)
      expect(c.zIndex).toBeGreaterThan(b.zIndex)
    })

    it('honors explicit position and size overrides', () => {
      const { window } = openOne(INITIAL, {
        position: { x: 200, y: 150 },
        size: { width: 800, height: 600 },
      })
      expect(window.position).toEqual({ x: 200, y: 150 })
      expect(window.size).toEqual({ width: 800, height: 600 })
    })

    it('falls back to default position and size when omitted', () => {
      const { window } = openOne()
      expect(window.position).toEqual({ x: 80, y: 80 })
      expect(window.size).toEqual({ width: 640, height: 440 })
    })
  })

  describe('closeWindow', () => {
    it('removes the window from byId and ids', () => {
      const { state, window } = openOne()
      const next = reducer(state, closeWindow({ id: window.id }))
      expect(next.byId[window.id]).toBeUndefined()
      expect(next.ids).not.toContain(window.id)
    })

    it('is a no-op for an unknown id', () => {
      const next = reducer(INITIAL, closeWindow({ id: 'does-not-exist' }))
      expect(next).toBe(INITIAL)
    })

    it('does NOT reset zCounter', () => {
      const { state, window } = openOne()
      expect(state.zCounter).toBe(1)
      const next = reducer(state, closeWindow({ id: window.id }))
      expect(next.zCounter).toBe(1)
    })
  })

  describe('focusWindow', () => {
    it('promotes a non-top window to the top of the stack', () => {
      const opened = openABC()
      const [aId, , cId] = opened.ids
      const state = reducer(opened, focusWindow({ id: aId }))
      expect(state.byId[aId].zIndex).toBeGreaterThan(state.byId[cId].zIndex)
    })

    it('skips the bump when the target is already top', () => {
      const { state, window } = openOne()
      const before = state.zCounter
      const next = reducer(state, focusWindow({ id: window.id }))
      expect(next.zCounter).toBe(before)
    })

    it('un-minimizes a minimized window on focus', () => {
      const { state, window } = openOne()
      const minimized = reducer(state, minimizeWindow({ id: window.id }))
      const focused = reducer(minimized, focusWindow({ id: window.id }))
      expect(focused.byId[window.id].isMinimized).toBe(false)
    })
  })

  describe('minimizeWindow', () => {
    it('sets isMinimized=true without touching zIndex', () => {
      const { state, window } = openOne()
      const zBefore = window.zIndex
      const next = reducer(state, minimizeWindow({ id: window.id }))
      expect(next.byId[window.id].isMinimized).toBe(true)
      expect(next.byId[window.id].zIndex).toBe(zBefore)
    })
  })

  describe('restoreWindow', () => {
    it('sets isMinimized=false and promotes to top', () => {
      let state = reducer(INITIAL, openWindow({ kind: 'welcome', title: 'A' }))
      state = reducer(state, openWindow({ kind: 'welcome', title: 'B' }))
      const [aId, bId] = state.ids
      state = reducer(state, minimizeWindow({ id: aId }))
      state = reducer(state, restoreWindow({ id: aId }))
      expect(state.byId[aId].isMinimized).toBe(false)
      expect(state.byId[aId].zIndex).toBeGreaterThan(state.byId[bId].zIndex)
    })
  })

  describe('toggleMaximize', () => {
    it('snapshots prevGeometry on maximize and restores it on second toggle', () => {
      const { state, window } = openOne(INITIAL, {
        position: { x: 120, y: 80 },
        size: { width: 600, height: 400 },
      })
      const viewport = { width: 1920, height: 1040 }

      const maxed = reducer(state, toggleMaximize({ id: window.id, viewport }))
      const m = maxed.byId[window.id]
      expect(m.isMaximized).toBe(true)
      expect(m.position).toEqual({ x: 0, y: 0 })
      expect(m.size).toEqual({ width: 1920, height: 1040 })
      expect(m.prevGeometry).toEqual({ x: 120, y: 80, width: 600, height: 400 })

      const restored = reducer(maxed, toggleMaximize({ id: window.id, viewport }))
      const r = restored.byId[window.id]
      expect(r.isMaximized).toBe(false)
      expect(r.position).toEqual({ x: 120, y: 80 })
      expect(r.size).toEqual({ width: 600, height: 400 })
      expect(r.prevGeometry).toBeNull()
    })
  })

  describe('moveWindow', () => {
    it('updates position for a non-maximized window', () => {
      const { state, window } = openOne()
      const next = reducer(state, moveWindow({ id: window.id, x: 300, y: 220 }))
      expect(next.byId[window.id].position).toEqual({ x: 300, y: 220 })
    })

    it('refuses to move a maximized window', () => {
      const { state, window } = openOne()
      const maxed = reducer(
        state,
        toggleMaximize({ id: window.id, viewport: { width: 1920, height: 1040 } })
      )
      const positionAfterMaximize = maxed.byId[window.id].position
      const moved = reducer(maxed, moveWindow({ id: window.id, x: 300, y: 220 }))
      expect(moved.byId[window.id].position).toEqual(positionAfterMaximize)
    })
  })

  describe('resizeWindow', () => {
    it('enforces the minimum width and height', () => {
      const { state, window } = openOne()
      const next = reducer(state, resizeWindow({ id: window.id, width: 10, height: 10 }))
      expect(next.byId[window.id].size.width).toBeGreaterThanOrEqual(240)
      expect(next.byId[window.id].size.height).toBeGreaterThanOrEqual(160)
    })
  })

  describe('selectors', () => {
    it('selectZCounter returns state.window.zCounter', () => {
      const { state } = openOne()
      expect(selectZCounter(rootFrom(state))).toBe(state.zCounter)
    })

    it('selectWindowById returns the matching window or undefined', () => {
      const { state, window } = openOne()
      expect(selectWindowById(window.id)(rootFrom(state))).toEqual(window)
      expect(selectWindowById('win-404')(rootFrom(state))).toBeUndefined()
    })

    it('selectOpenWindows returns windows in insertion order, NOT z-order', () => {
      const opened = openABC()
      const insertionIds = [...opened.ids]
      const state = reducer(opened, focusWindow({ id: insertionIds[0] }))
      const resultIds = selectOpenWindows(rootFrom(state)).map((w) => w.id)
      expect(resultIds).toEqual(insertionIds)
    })

    it('selectTopWindowId ignores minimized windows', () => {
      let state = reducer(INITIAL, openWindow({ kind: 'welcome', title: 'A' }))
      state = reducer(state, openWindow({ kind: 'welcome', title: 'B' }))
      const [aId, bId] = state.ids
      state = reducer(state, minimizeWindow({ id: bId }))
      expect(selectTopWindowId(rootFrom(state))).toBe(aId)
    })

    it('returns null from selectTopWindowId when no windows are visible', () => {
      // No windows open at all.
      expect(selectTopWindowId(rootFrom(INITIAL))).toBeNull()
      // A single window that is minimized — nothing is visually on top.
      let state = reducer(INITIAL, openWindow({ kind: 'welcome', title: 'A' }))
      const [aId] = state.ids
      state = reducer(state, minimizeWindow({ id: aId }))
      expect(selectTopWindowId(rootFrom(state))).toBeNull()
    })

    it('selectVisibleWindows omits minimized windows', () => {
      let state = reducer(INITIAL, openWindow({ kind: 'welcome', title: 'A' }))
      state = reducer(state, openWindow({ kind: 'welcome', title: 'B' }))
      const [aId, bId] = state.ids
      state = reducer(state, minimizeWindow({ id: bId }))
      const visibleIds = selectVisibleWindows(rootFrom(state)).map((w) => w.id)
      expect(visibleIds).toEqual([aId])
    })
  })
})
