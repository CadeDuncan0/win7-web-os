<!-- Created: 2026-05-28 00:42:28 -->
<!-- Completed: 2026-06-01 03:27:12 -->

# 🎯 Task 1: Expand Window Slice Logic

---

## 🧠 Engineering Context & Rationale

### Why `windowSlice` Is A Different Problem Than `sessionSlice`

`sessionSlice` (Task 3 of Phase 1) modeled a **single entity** — one authenticated session at a
time. Every field had a known position; the state shape was a flat record; selectors were
one-line field accesses.

`windowSlice` is the opposite shape — a **collection of identities** that opens and closes at
runtime, in arbitrary order, with no upper bound. Every design decision below is downstream of
that single difference.

| `sessionSlice` (Phase 1)                    | `windowSlice` (this task)                                                  |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| One session, ever                           | N windows, opened and closed at runtime                                    |
| No identity — the singleton _is_ the entity | Each window has an `id` that must survive minimize → restore round-trips   |
| No ordering                                 | Stacking order is a first-class concern — which window is on top?          |
| Pure field assignment                       | Add / remove / update inside a collection; some updates are conditional    |
| Selectors are field accesses                | Selectors range from O(1) lookups to derived O(N log N) computations       |
| Phase 0 scaffold was _wrong_ in shape       | Phase 0 scaffold is _empty_ — has the shell, no reducers, no working state |

Treat the Phase 0 scaffold as a placeholder you are replacing entirely, not extending. The
existing `windows: { [key: string]: { x: number; y: number } }` does not survive contact with
any of the requirements in `CLAUDE.md`'s **Window Manager Rules** section. Re-read that section
now if it isn't fresh — every requirement below cites it.

### State Shape: Normalized By Id, Ordered By z-Index

You will be tempted to model open windows as an **array**:

```ts
// WRONG — do not do this
interface WindowState {
  windows: WindowInstance[]
}
```

Three things break with an array model:

1. **Lookup by id is O(N)** — every selector for a single window scans the array. Every action
   that targets a specific window (`focusWindow(id)`, `closeWindow(id)`, `moveWindow(id, ...)`)
   also scans. A desktop with 10 open windows hits this path on every pointer event during drag.
2. **Stacking order drifts.** If "first in array = top of stack," then `focusWindow` must
   re-order the array, and every component subscribed to the list re-renders on every focus
   change — even components that only render their own window.
3. **React keying gets brittle.** If you ever `splice` to reorder, React reuses DOM nodes by
   index, and `<AnimatePresence>` (Task 13) loses its identity-tracking for the exit animation.

The production-shaped slice **normalizes** windows by id and tracks **monotonic counters** for
identity and z-index. Stacking order is _derived_ from `zIndex`, not stored separately.

```ts
interface WindowState {
  byId: Record<string, WindowInstance> // O(1) lookup
  ids: string[] // stable insertion order — NOT z-order
  zCounter: number // monotonic; ++ on every focus
  nextIdSeed: number // monotonic; ++ on every openWindow
}
```

- `byId` is the registry. Every reducer that mutates a window touches one entry here.
- `ids` is the **insertion-order roster** — used to render the list of windows in a stable DOM
  order so React's keyed reconciliation is happy. It is _never_ reordered on focus.
- `zCounter` is a single integer that increments forever. The current top-of-stack window is
  whichever window has `zIndex === zCounter` after the most recent `focusWindow`. Stacking is
  computed from this, never stored as a list.
- `nextIdSeed` is the counter for generating new window ids inside the reducer (more on this
  in **ID Generation** below).

### z-Index As A Monotonic Counter — Why Not An Array Position?

A common first instinct is "an array of ids in z-order — last item is on top." This works
mechanically; it fails architecturally for three reasons:

1. **Focus mutations are O(N).** Bumping a window to the top means removing it from somewhere
   in the array and pushing it to the end. Every other window's index shifts. Every component
   subscribed to "my window's z-position" re-renders.
2. **CSS `z-index` is a number, not an index.** You'd still have to compute a numeric `zIndex`
   for the DOM from the array position. Two sources of truth — the array order and the rendered
   `style.zIndex` — that must stay in sync.
3. **It fights `<AnimatePresence>`.** Framer Motion identifies elements by `layoutId` / React
   key, and re-ordering siblings can re-trigger layout animations spuriously.

A monotonic counter sidesteps all three:

```
t=0   openWindow('A')   → A.zIndex = 1    zCounter = 1
t=1   openWindow('B')   → B.zIndex = 2    zCounter = 2
t=2   openWindow('C')   → C.zIndex = 3    zCounter = 3
t=3   focusWindow('A')  → A.zIndex = 4    zCounter = 4    [A is now on top]
t=4   focusWindow('B')  → B.zIndex = 5    zCounter = 5    [B is now on top]
```

The DOM render order never changes. Only the `style.zIndex` of the focused window changes. One
mutation per focus event, O(1).

> **"But integers can overflow!"** A 32-bit signed int caps at 2.1 billion. Even at one focus
> event per millisecond — superhumanly fast — that's 24 days of continuous clicking. The site
> is not a long-running daemon; a page reload resets the counter. This is a non-problem.

### `prevGeometry` — Why Maximize/Restore Must Persist Its Inverse

Windows 7 (and every other windowing system) has the same maximize/restore contract: clicking
maximize fills the viewport; clicking restore returns the window to **exactly** where and how
big it was before. Not "the default position" — the prior position.

That contract is impossible to honor unless the slice persists the pre-maximize geometry. The
window cannot remember its own prior state during a maximize — by definition, it has been
overwritten.

```
Before maximize:           {x:120, y:80, w:600, h:400, isMaximized:false}
On toggleMaximize:         prevGeometry = {x:120, y:80, w:600, h:400}
                           x, y, w, h overwritten to viewport bounds
                           isMaximized = true
On toggleMaximize again:   x, y, w, h restored FROM prevGeometry
                           prevGeometry = null
                           isMaximized = false
```

A common Junior mistake is making `prevGeometry` live in component state. It cannot. Reason: a
maximized window can be **closed and re-opened** from the taskbar; its content component
unmounts; component state is destroyed. The slice survives. Therefore the slice owns
`prevGeometry`.

### Identity Generation — Counter, Not UUID

Reducers must be **pure functions**. The same `(state, action)` pair must always produce the
same next state. This is the foundation of:

- Reproducible Redux DevTools time-travel
- Deterministic snapshot tests
- Predictable test fixtures

`crypto.randomUUID()` violates purity — it returns a new value every call. Calling it inside a
reducer produces non-deterministic state mutations, and your snapshot test will fail on every
run for a reason unrelated to the assertion.

Options for id generation:

| Strategy                                      | Pure? | Verdict for this slice                               |
| --------------------------------------------- | ----- | ---------------------------------------------------- |
| `crypto.randomUUID()` inside reducer          | No    | Rejected — breaks reducer purity                     |
| `Date.now()` inside reducer                   | No    | Rejected — same problem; also collides under load    |
| Generate UUID in caller, pass via action      | Yes   | Acceptable but pushes ceremony onto every dispatch   |
| **Monotonic counter in slice (`nextIdSeed`)** | Yes   | **Selected** — pure, debuggable, deterministic, tiny |

The counter approach reads beautifully in Redux DevTools: window ids are `win-1`, `win-2`,
`win-3`. You can trace any bug by id without copying 36-character UUIDs around.

### Selectors: The Three Categories You'll Write Here

`sessionSlice` had only category 1 (plain field access). `windowSlice` has all three. Knowing
which category a selector belongs to determines whether it needs `createSelector`.

| Category               | Example                 | Memoize?                                                                                             |
| ---------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| 1. Field access        | `selectZCounter(state)` | No — returning a primitive; no derivation cost; reference equality is trivially correct              |
| 2. O(1) lookup by id   | `selectWindowById(id)`  | No — direct property read; returns a stored reference; cheap and stable                              |
| 3. Derived computation | `selectTopWindowId`     | **Yes** — derived from scanning every window; output reference identity matters for re-render gating |

**Rule of thumb:** if the selector's body contains `.filter`, `.map`, `.sort`, `.reduce`, or
constructs a new object/array, it likely needs `createSelector`. The output of
`.filter([...])` is a _new array reference every call_, which means `useAppSelector(selectOpenWindowsArray)` re-renders on every dispatch even when the underlying data has not changed.

This is the **same trap** the Phase 1 task warned about for `selectIsAdmin`, but here the trap
is concrete and dangerous: a 60fps drag of one window would re-render every other window's
subscriber on every frame if the selector wasn't memoized.

### What This Task Does NOT Own

The temptation when wiring window state is to bake in every concern at the slice layer. Resist.
These belong elsewhere:

| Concern                                   | Where it lives                                         | Task    |
| ----------------------------------------- | ------------------------------------------------------ | ------- |
| Boundary clamping (keep window on-screen) | Component-layer `pointermove` handler, before dispatch | Task 10 |
| Snap-to-grid (windows do not snap)        | N/A — only icons snap; windows are free-form           | Task 7  |
| What renders **inside** a window          | Window-content registry mapping `kind` → component     | Task 16 |
| Animations on open/close/minimize         | Framer Motion at the component layer                   | Task 13 |
| Taskbar button per window                 | Subscribes to selectors from this slice                | Task 14 |

The slice's job is **state**, not behavior. A reducer never measures the viewport, never reads
the DOM, never spawns a timer. If you find yourself wanting to do any of those, the logic
belongs upstream of `dispatch`, not inside the reducer.

### Immer Reminder

Same rule as Phase 1's Task 3: inside reducers, write mutation-style — Immer makes it safe.
Outside reducers, treat state as immutable.

```ts
// Inside a reducer — legal, produces a new immutable state via Immer's draft
moveWindow(state, action) {
  const win = state.byId[action.payload.id]
  if (!win) return
  win.position.x = action.payload.x   // looks like mutation, isn't
  win.position.y = action.payload.y
}
```

The early `return` is a defensive guard for "action targets a window that no longer exists"
(e.g., a stale pointermove event after the window has been closed). This is a real bug class
during fast interaction sequences; handle it.

---

## 🛠️ Step-by-Step Implementation

### Step 1 — Audit The Existing Phase 0 Scaffold

[`src/store/slices/windowSlice.ts`](../../../../src/store/slices/windowSlice.ts) currently contains:

```ts
interface WindowState {
  windows: {
    [key: string]: {
      x: number
      y: number
    }
  }
}

const initialState: WindowState = { windows: {} }

const windowSlice = createSlice({
  name: 'window',
  initialState,
  reducers: {
    // Phase 2: openWindow, closeWindow, minimizeWindow, maximizeWindow, focusWindow
  },
})

export default windowSlice.reducer
```

### Step 2 — Define The State Shape

Rewrite [`src/store/slices/windowSlice.ts`](../../../../src/store/slices/windowSlice.ts) from
scratch. Start with the type layer; do not write reducers yet.

```ts
import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { RootState } from '@/store'

// ─── Types ──────────────────────────────────────────────────────────────────

// Discriminator for what content renders inside the window. The slice is
// content-agnostic — a registry component (Task 16) maps kind → React component.
// Add new kinds here as windows are introduced in Phase 2 and Phase 3.
export type WindowKind = 'welcome' | 'about-this-pc'

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
```

### Step 3 — Implement The Reducer Family

Write each reducer below the slice's `name` / `initialState`. Every reducer body is a TODO.
Solve them in the listed order — later ones build on patterns established by earlier ones.

```ts
const windowSlice = createSlice({
  name: 'window',
  initialState,
  reducers: {
    // ── openWindow ────────────────────────────────────────────────────────
    // TODO: [Action required by Junior]
    // Payload: { kind: WindowKind; title: string; position?: {x,y}; size?: {w,h} }
    // Behavior:
    //   1. Generate the id from state.nextIdSeed (e.g. `win-${++state.nextIdSeed}`).
    //   2. Bump state.zCounter; the new window's zIndex = state.zCounter.
    //      (New windows always open on top — Windows 7 semantics.)
    //   3. Default position to { x: 80, y: 80 } if not provided.
    //   4. Default size to   { width: 640, height: 440 } if not provided.
    //   5. isMinimized and isMaximized start false; prevGeometry starts null.
    //   6. Insert into byId and append to ids (stable DOM order).
    openWindow(
      state,
      action: PayloadAction<{
        kind: WindowKind
        title: string
        position?: { x: number; y: number }
        size?: { width: number; height: number }
      }>
    ) {
      // ...
    },

    // ── closeWindow ───────────────────────────────────────────────────────
    // TODO: [Action required by Junior]
    // Payload: { id: string }
    // Behavior:
    //   1. If state.byId[id] is undefined, return immediately (idempotent).
    //   2. Delete byId[id].
    //   3. Remove id from state.ids (preserve order of remaining ids).
    //   4. Do NOT touch zCounter — it remains monotonically increasing.
    //      (Reusing a freed z-index would create stacking ambiguity.)
    closeWindow(state, action: PayloadAction<{ id: string }>) {
      // ...
    },

    // ── focusWindow ───────────────────────────────────────────────────────
    // TODO: [Action required by Junior]
    // Payload: { id: string }
    // Behavior:
    //   1. If window does not exist, return (idempotent).
    //   2. If window is minimized, set isMinimized = false (restore-on-focus).
    //      Rationale: per Windows 7 semantics, focusing a minimized window
    //      from the taskbar both un-minimizes AND brings to front.
    //   3. Bump zCounter; assign window.zIndex = state.zCounter.
    //   4. If the window is already at the top (zIndex === state.zCounter
    //      BEFORE the bump), skip the bump entirely to avoid churn during
    //      back-to-back clicks on the active window.
    focusWindow(state, action: PayloadAction<{ id: string }>) {
      // ...
    },

    // ── minimizeWindow ────────────────────────────────────────────────────
    // TODO: [Action required by Junior]
    // Payload: { id: string }
    // Behavior:
    //   1. If window does not exist, return.
    //   2. Set isMinimized = true.
    //   3. Do NOT change zIndex. (The window keeps its stacking position so
    //      that restoring it returns it to its prior place — unless the user
    //      explicitly focused another window in the meantime, in which case
    //      restore-on-focus in focusWindow will promote it then.)
    minimizeWindow(state, action: PayloadAction<{ id: string }>) {
      // ...
    },

    // ── restoreWindow ─────────────────────────────────────────────────────
    // TODO: [Action required by Junior]
    // Payload: { id: string }
    // Behavior:
    //   1. If window does not exist, return.
    //   2. Set isMinimized = false.
    //   3. Bump zCounter and assign window.zIndex = state.zCounter
    //      (restore brings to front — same as focusWindow's promotion).
    // Question to internalize: why is this a separate reducer from focusWindow
    // when their bodies are nearly identical? Answer in the Challenge.
    restoreWindow(state, action: PayloadAction<{ id: string }>) {
      // ...
    },

    // ── toggleMaximize ────────────────────────────────────────────────────
    // TODO: [Action required by Junior]
    // Payload: { id: string; viewport: { width: number; height: number } }
    // Behavior:
    //   1. If window does not exist, return.
    //   2. If isMaximized === false:
    //        - Snapshot the current geometry into prevGeometry.
    //        - Overwrite position to { x: 0, y: 0 }.
    //        - Overwrite size from action.payload.viewport (minus any taskbar
    //          height — but DO NOT subtract here; let the component layer
    //          pass a viewport that already excludes the taskbar).
    //        - Set isMaximized = true.
    //   3. If isMaximized === true:
    //        - Restore position and size from prevGeometry.
    //        - Set prevGeometry = null.
    //        - Set isMaximized = false.
    // Note: the slice does NOT measure the viewport itself — that's a DOM
    // concern. The caller passes viewport dimensions in the payload. This
    // keeps the reducer pure.
    toggleMaximize(
      state,
      action: PayloadAction<{ id: string; viewport: { width: number; height: number } }>
    ) {
      // ...
    },

    // ── moveWindow ────────────────────────────────────────────────────────
    // TODO: [Action required by Junior]
    // Payload: { id: string; x: number; y: number }
    // Behavior:
    //   1. If window does not exist, return.
    //   2. If isMaximized === true, return (maximized windows can't be moved).
    //   3. Set position.x and position.y from the payload as-is.
    //      DO NOT clamp here. Boundary clamping is the responsibility of the
    //      component drag handler (Task 10) which has access to the viewport.
    moveWindow(state, action: PayloadAction<{ id: string; x: number; y: number }>) {
      // ...
    },

    // ── resizeWindow ──────────────────────────────────────────────────────
    // TODO: [Action required by Junior]
    // Payload: { id: string; width: number; height: number }
    // Behavior:
    //   1. If window does not exist, return.
    //   2. If isMaximized === true, return.
    //   3. Enforce a hard minimum (e.g., 240 × 160) — windows narrower than
    //      that have unusable chrome. Decide your minimums and document them.
    //   4. Set size.width and size.height accordingly.
    resizeWindow(state, action: PayloadAction<{ id: string; width: number; height: number }>) {
      // ...
    },
  },
})

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
```

### Step 4 — Implement The Selectors

Selectors are the public read API. Component code (Tasks 10, 13, 16, 17) reads through these
and never touches `state.window.*`.

```ts
// ─── Selectors ──────────────────────────────────────────────────────────────

// Category 1 — primitive field access. No memoization needed.
// TODO: [Action required by Junior] - Implement selectZCounter
export const selectZCounter = (state: RootState): number => {
  // ...
  return 0
}

// Category 2 — O(1) lookup. Returns a stored reference; no new allocation.
// Higher-order selector: returns a *selector* parameterized by id.
// Usage in a component: useAppSelector(selectWindowById('win-3'))
// TODO: [Action required by Junior] - Implement selectWindowById
export const selectWindowById =
  (id: string) =>
  (state: RootState): WindowInstance | undefined => {
    // ...
    return undefined
  }

// Category 3 — derived computation. MUST be memoized with createSelector,
// otherwise every consumer re-renders on unrelated dispatches.
// TODO: [Action required by Junior] - Implement selectOpenWindows
// Returns: WindowInstance[] in stable insertion order (state.ids order).
// Why insertion order, not z-order? DOM render order should be stable so React's
// keyed reconciliation does not move nodes. The visual stacking is handled by
// each window's style.zIndex, not by sibling order in the DOM.
export const selectOpenWindows = createSelector(
  [(state: RootState) => state.window.byId, (state: RootState) => state.window.ids],
  (byId, ids): WindowInstance[] => {
    // ...
    return []
  }
)

// TODO: [Action required by Junior] - Implement selectTopWindowId
// Returns: the id of the window with the highest zIndex, ignoring minimized
// windows. Returns null if no non-minimized windows are open.
// Why ignore minimized? A minimized window is not visually on-screen, so it
// cannot be the active/top window even if its zIndex is the largest.
export const selectTopWindowId = createSelector([selectOpenWindows], (windows): string | null => {
  // ...
  return null
})

// TODO: [Action required by Junior] - Implement selectVisibleWindows
// Returns: WindowInstance[] of windows where isMinimized === false.
// Used by the WindowManager renderer (Task 16) to decide what to mount.
// Minimized windows are intentionally unmounted from the DOM — their state
// survives in the slice; their components do not.
export const selectVisibleWindows = createSelector([selectOpenWindows], (windows) => {
  // ...
  return [] as WindowInstance[]
})
```

### Step 5 — Write The Unit Test Suite

Create `src/store/slices/windowSlice.test.ts`. Mirror the structure of
`src/store/slices/sessionSlice.test.ts` from Phase 1 — same import pattern, same describe layout,
same `rootFrom` helper convention.

```ts
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

// Helper — selectors only read state.window, so the rest of RootState can be a stub.
const rootFrom = (window: WindowState): RootState => ({ window }) as unknown as RootState

// Convenience — opens a window via the reducer chain so tests share a starting state.
const openOne = (
  state: WindowState = INITIAL,
  overrides: Partial<Parameters<typeof openWindow>[0]> = {}
): { state: WindowState; window: WindowInstance } => {
  const next = reducer(state, openWindow({ kind: 'welcome', title: 'Welcome', ...overrides }))
  const id = next.ids[next.ids.length - 1]
  return { state: next, window: next.byId[id] }
}

describe('windowSlice', () => {
  describe('initial state', () => {
    it('matches the empty registry shape', () => {
      // TODO: [Action required by Junior]
      // Assert reducer(undefined, {type:'@@INIT'}) deep-equals INITIAL.
    })
  })

  describe('openWindow', () => {
    it('assigns sequential ids starting at win-1', () => {
      // TODO: [Action required by Junior]
      // Open three windows in sequence. Assert ids === ['win-1','win-2','win-3'].
    })

    it('places each new window on top of the stack', () => {
      // TODO: [Action required by Junior]
      // Open three windows. Assert the third's zIndex > the second's > the first's.
    })

    it('honors explicit position and size overrides', () => {
      // TODO: [Action required by Junior]
      // Open one with position { x: 200, y: 150 } and size { width: 800, height: 600 }.
      // Assert all four fields land verbatim.
    })

    it('falls back to default position and size when omitted', () => {
      // TODO: [Action required by Junior]
      // Open one with no position / size override. Assert your declared defaults.
    })
  })

  describe('closeWindow', () => {
    it('removes the window from byId and ids', () => {
      // TODO: [Action required by Junior]
    })

    it('is a no-op for an unknown id', () => {
      // TODO: [Action required by Junior]
      // Dispatch closeWindow({ id: 'does-not-exist' }) against an empty state.
      // Assert state is unchanged (reference-equal is acceptable here).
    })

    it('does NOT reset zCounter', () => {
      // TODO: [Action required by Junior]
      // Open one window (zCounter -> 1), close it. Assert state.zCounter is still 1.
      // The Challenge asks you to justify this — answer there before writing the test.
    })
  })

  describe('focusWindow', () => {
    it('promotes a non-top window to the top of the stack', () => {
      // TODO: [Action required by Junior]
      // Open A, B, C (C is top). Focus A. Assert A.zIndex > C.zIndex.
    })

    it('skips the bump when the target is already top', () => {
      // TODO: [Action required by Junior]
      // Open A. Read zCounter. Focus A. Assert zCounter has NOT changed.
    })

    it('un-minimizes a minimized window on focus', () => {
      // TODO: [Action required by Junior]
      // Open A, minimize A, focus A. Assert A.isMinimized === false.
    })
  })

  describe('minimizeWindow', () => {
    it('sets isMinimized=true without touching zIndex', () => {
      // TODO: [Action required by Junior]
    })
  })

  describe('restoreWindow', () => {
    it('sets isMinimized=false and promotes to top', () => {
      // TODO: [Action required by Junior]
    })
  })

  describe('toggleMaximize', () => {
    it('snapshots prevGeometry on maximize and restores it on second toggle', () => {
      // TODO: [Action required by Junior]
      // Open A with position { x:120, y:80 }, size { w:600, h:400 }.
      // Toggle maximize with viewport { width:1920, height:1040 }.
      // Assert: A.isMaximized === true, A.position === {0,0},
      //         A.size === {1920,1040}, A.prevGeometry === {120,80,600,400}.
      // Toggle again. Assert geometry restored exactly; prevGeometry === null.
    })
  })

  describe('moveWindow', () => {
    it('updates position for a non-maximized window', () => {
      // TODO: [Action required by Junior]
    })

    it('refuses to move a maximized window', () => {
      // TODO: [Action required by Junior]
      // Open, maximize, move. Assert position is unchanged.
    })
  })

  describe('resizeWindow', () => {
    it('enforces the minimum width and height', () => {
      // TODO: [Action required by Junior]
      // Open one. Try to resize to { width: 10, height: 10 }.
      // Assert width >= your declared minWidth and height >= your declared minHeight.
    })
  })

  describe('selectors', () => {
    it('selectZCounter returns state.window.zCounter', () => {
      // TODO: [Action required by Junior]
    })

    it('selectWindowById returns the matching window or undefined', () => {
      // TODO: [Action required by Junior]
      // Cover both the hit case and the miss case.
    })

    it('selectOpenWindows returns windows in insertion order, NOT z-order', () => {
      // TODO: [Action required by Junior]
      // Open A, B, C. Focus A (now top). Assert selectOpenWindows order is still [A,B,C].
    })

    it('selectTopWindowId ignores minimized windows', () => {
      // TODO: [Action required by Junior]
      // Open A then B (B on top). Minimize B. Assert selectTopWindowId === A.id.
    })

    it('selectVisibleWindows omits minimized windows', () => {
      // TODO: [Action required by Junior]
    })
  })
})
```

Run:

```bash
npx jest src/store/slices/windowSlice.test.ts
```

Every test must pass before this task can move to `complete/`. A failing reducer test is
permission to revisit Step 3; a failing selector test is permission to revisit Step 4. Do not
loosen an assertion to make it pass — fix the implementation.

### Step 6 — Confirm Redux DevTools See The New Shape

1. Run `npm run dev`.
2. Open the browser's Redux DevTools extension.
3. Inspect the `window` slice. You should see:
   ```json
   { "byId": {}, "ids": [], "zCounter": 0, "nextIdSeed": 0 }
   ```
4. In the "Dispatch" panel, fire:
   ```json
   { "type": "window/openWindow", "payload": { "kind": "welcome", "title": "Welcome" } }
   ```
5. Confirm: `byId` has one entry keyed `win-1`; `ids` is `["win-1"]`; `zCounter` is `1`;
   `nextIdSeed` is `1`. The window has the default position and size you declared.
6. Fire `{ "type": "window/openWindow", "payload": { "kind": "about-this-pc", "title": "About" } }`.
   Confirm `win-2` exists with `zIndex: 2`.
7. Fire `{ "type": "window/focusWindow", "payload": { "id": "win-1" } }`. Confirm
   `byId.win-1.zIndex === 3` and `zCounter === 3`.
8. Fire `{ "type": "window/closeWindow", "payload": { "id": "win-2" } }`. Confirm `win-2` is
   gone from `byId` and `ids`; `zCounter` is still `3` (un-touched by close).

If any of these behave differently, you have a reducer bug — fix it before moving on.

### Step 7 — Update The Phase 0 Comment Stubs

The Phase 0 scaffold left these `// Phase 2: ...` placeholder comments:

```ts
// Phase 2: will hold open windows, z-index stack, minimized state
// Phase 2: openWindow, closeWindow, minimizeWindow, maximizeWindow, focusWindow
```

After your rewrite they are obsolete. Delete them. The new code is self-documenting; leaving
stale phase-forward comments creates exactly the kind of rot CLAUDE.md's "Don't add comments"
rule warns against.

---

## 📝 Validation Report

```
## Task 1 — Window Slice Validation Checklist

| #   | Check                                                                          | Status |
| --- | ------------------------------------------------------------------------------ | ------ |
| 1   | `[Audit]:` block in Step 1 lists ≥ 5 defects with product consequences          |   ?   |
| 2   | `WindowState` shape includes byId, ids, zCounter, nextIdSeed                    |   ?   |
| 3   | `WindowInstance` includes id, kind, title, position, size, zIndex, isMinimized, isMaximized, prevGeometry | ?  |
| 4   | All 8 reducers implemented (openWindow, closeWindow, focusWindow, minimizeWindow, restoreWindow, toggleMaximize, moveWindow, resizeWindow) | ?  |
| 5   | All 5 selectors implemented; selectOpenWindows / selectTopWindowId / selectVisibleWindows use createSelector | ? |
| 6   | `npx tsc --noEmit` is clean                                                     |   ?   |
| 7   | `npx jest src/store/slices/windowSlice.test.ts` — every test passes             |   ?   |
| 8   | Redux DevTools dispatch sequence (Step 6) produces the documented state shape   |   ?   |
| 9   | `// Phase 2: ...` comment stubs removed                                         |   ?   |
| 10  | `npm run lint` is clean (no-console, curly, import/order, no-unused-vars)       |   ?   |
| 11  | Every Challenge `[Answer]:` block below is filled in                            |   ?   |

Validated by: Cade
Validated on:
```
