<!-- Created: 2026-06-01 03:35:59 -->

# 🎯 Task 2: Expand Desktop Slice Logic

---

## 🧠 Engineering Context & Rationale

### What This Slice Owns — And Why It Is Not Just "windowSlice With Icons"

You just shipped `windowSlice` (Task 1). The reflex is to clone it. Resist the clone reflex and
reason from the differences, because two of them change the design materially:

| Axis               | `windowSlice` (Task 1)                   | `desktopSlice` (this task)                                                 |
| ------------------ | ---------------------------------------- | -------------------------------------------------------------------------- |
| Membership         | Windows open/close at runtime, unbounded | Icons are a **fixed, seeded set** — registered once at desktop mount       |
| Identity source    | Slice mints ids (`win-1`, `nextIdSeed`)  | Ids come from an **in-repo registry** (Task 17) — the slice is told the id |
| Lifecycle trigger  | User actions only                        | User actions **plus a reaction to another slice** (`session` ending)       |
| Persistence        | None — windows are pure runtime          | **Role-gated**: Admin layout durable, Guest layout resets on session end   |
| Position semantics | Free-form pixels (`{x,y}`)               | **Snap-to-grid cells** (`{column,row}`) — pixels are derived, not stored   |

The two rows that carry real architectural weight are the last three: the **cross-slice
reaction**, the **role-gated persistence boundary**, and the **grid-cell position model**. Those
are the parts of this task that are genuinely new versus everything you've built so far. The
normalized `byId` + `ids` registry, the Immer mutation style, the selector taxonomy, the
idempotent "unknown id → return" guards — all of that you already proved in Task 1. Reuse it
verbatim. Spend your thinking budget on what's new.

### Position Model: Store The Grid Cell, Derive The Pixel

A window lives anywhere — it is dragged free-form, so its canonical state is a pixel coordinate.
An icon does **not** live anywhere. It snaps to a grid. Its canonical state is therefore a
**cell**, not a pixel:

```ts
interface GridCell {
  column: number
  row: number
}
```

The conversion `cell ↔ {x,y}px` is a **render-time projection** owned by the grid component
(Task 8 — "column-row ↔ x,y px conversion"). The slice never stores pixels. Why this matters,
concretely:

- **Resolution independence.** A pixel position computed for a 1920-wide viewport is wrong on a
  1366-wide one. A cell `{column: 3, row: 1}` is correct on both — the projection re-runs.
- **Reset is trivial and exact.** "Snap back to the default layout" is `position = defaultPosition`
  over a tiny integer pair. No floating-point drift, no remembered pixel math.
- **Collision logic stays integer.** Task 8's "target cell occupied → next free cell" scan is a
  comparison of `{column,row}` pairs, not a bounding-box intersection test.

> The principle is the same one `windowSlice` taught with `prevGeometry`: **store the semantic
> value, derive the presentational one.** There it was "store geometry, let CSS position the
> window." Here it is "store the cell, let the grid place the icon."

### `defaultPosition` Is To Icons What `prevGeometry` Was To Windows

`resetGuestPositions` has an impossible job unless every icon remembers where it _started_. A
moved icon has overwritten its own position — by definition it cannot reconstruct its origin.
So each icon carries a frozen snapshot of its seed cell:

```
Icon registered:          { position: {col:0,row:0}, defaultPosition: {col:0,row:0} }
User drags to col 4:      { position: {col:4,row:2}, defaultPosition: {col:0,row:0} }   ← default untouched
resetGuestPositions:      { position: {col:0,row:0}, defaultPosition: {col:0,row:0} }   ← position ⟵ default
```

`defaultPosition` is written **once**, at `registerIcon`, and never again. Every mutation path —
`setIconPosition`, the reset — touches `position` only. This is the exact snapshot-to-restore
pattern from Task 1's maximize/restore, applied to a different field.

### The Cross-Slice Reaction: `extraReducers`, Not A Component Side-Effect

Here is the centerpiece. The requirement reads: _"Guest positions reset on `sessionSlice` clear."_
A Junior's first instinct is to wire this in the logout component:

```ts
// WRONG — the persistence boundary leaks into the component layer
function handleSignOut() {
  signOut()
  if (role === 'guest') dispatch(resetGuestPositions()) // every caller must remember this
}
```

That is a bug factory. Every future place that ends a session (token expiry, tab-close handler,
an admin "switch user") must re-remember the rule. The Phase 2 Key Decision is explicit:
_"Persistence boundary is enforced in `desktopSlice`, not the component layer."_ The slice must
react to the session ending **by itself**.

Redux Toolkit's tool for "slice A reacts to slice B's action" is `extraReducers` with the
**builder callback** (the only form supported in the installed RTK — the legacy object form was
removed in 2.0; do not reach for it):

```ts
extraReducers: (builder) => {
  builder.addCase(clearSession, (state) => {
    // desktopSlice now responds to session/clearSession on its own
  })
}
```

`clearSession` is `sessionSlice`'s action creator. Importing it here is the first time one slice
imports another slice's actions in this codebase — that is **correct and intended** for a
cross-slice reaction, not a layering violation. (Action creators are just typed event names; the
dependency is on the event, not on `sessionSlice`'s internals.)

### Reducer Isolation Forces One Non-Obvious Move

Now the subtle part — the one that trips everyone the first time. A reducer can see **only its
own slice's state and the action**. The `clearSession` handler above receives `desktop` state
and a payload-less action. It has **no way to read `session.role`** — that lives in a slice it
cannot touch, and `clearSession` carries no payload telling it the role.

But the rule is role-dependent: Guest resets, Admin persists. So the desktop slice must **capture
the role-derived fact at the one moment it is observable** — when the session is _set_ — and hold
it locally:

```
session/setSession  (role: 'admin') ─▶ desktop captures: persistPositions = true
session/setSession  (role: 'guest') ─▶ desktop captures: persistPositions = false
session/clearSession                ─▶ desktop reads its OWN persistPositions flag and branches
```

So `desktopSlice` listens to **two** of `sessionSlice`'s actions: `setSession` (to capture the
flag) and `clearSession` (to act on it). Storing a role-derived boolean inside `desktop` is a
deliberate, minimal denormalization — the alternative (a `createListenerMiddleware` effect using
`getOriginalState()` to read `session.role` at clear-time) is the heavier, more "correct-looking"
tool, but it pushes this logic out of the slice and out of pure-reducer unit testing. For a single
boolean, the in-slice flag is the right call: it keeps the whole boundary synchronous, pure, and
testable with the same `reducer(state, action)` style you used in Tasks 1 and 3. **Capture intent
(`persistPositions`), not raw role** — the slice cares whether the layout is durable, not who is
logged in.

### Selector Taxonomy — The Same Three Categories From Task 1

No new selector theory. Slot each selector into the taxonomy you already know and the
memoization decision falls out:

| Category         | This slice's members                       | `createSelector`?                      |
| ---------------- | ------------------------------------------ | -------------------------------------- |
| 1. Field access  | `selectSelectedIconId`                     | No — primitive, reference-stable       |
| 2. O(1) lookup   | `selectIconById(id)`, `selectSelectedIcon` | No — returns a stored reference        |
| 3. Derived array | `selectDesktopIcons` (`ids.map`)           | **Yes** — `.map` allocates a new array |

`selectSelectedIcon` looks derived but isn't: it is a single `byId[selectedIconId]` lookup
returning a stored reference, so a plain function is correct. Only `selectDesktopIcons` builds a
new array (`ids.map(...)`) and therefore must be memoized, or every icon's subscriber re-renders
on every unrelated dispatch — exactly the 60fps trap Task 1 warned about, now during icon drag.

### What This Task Does NOT Own

| Concern                                          | Where it lives                                                                                                           | Task    |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------- |
| Cell ↔ pixel projection, snap math, drag preview | Grid component + `@dnd-kit`                                                                                              | Task 8  |
| Collision ("cell occupied → next free cell")     | Grid component drop handler                                                                                              | Task 8  |
| The static icon set (labels, images, targets)    | In-repo shortcut registry; dispatched via `registerIcon`                                                                 | Task 17 |
| Cross-**reload** durability (localStorage)       | Out of Phase 2 scope — "persist" here means in-memory, across the session boundary, per `CLAUDE.md` ("persist in Redux") | —       |

The slice holds **state**, never behavior. No reducer measures the grid, reads the DOM, or
resolves an asset path. If you feel the urge, the logic belongs upstream of `dispatch`.

---

## 🛠️ Step-by-Step Implementation

### Step 1 — Audit The Existing Phase 0 Scaffold

[`src/store/slices/desktopSlice.ts`](../../../../src/store/slices/desktopSlice.ts) currently contains:

```ts
interface DesktopState {
  // Phase 2: will hold icon positions, selected icon
  icons: {
    [key: string]: { x: number; y: number }
  }
}

const initialState: DesktopState = { icons: {} }

const desktopSlice = createSlice({
  name: 'desktop',
  initialState,
  reducers: {
    // Phase 2: setIconPosition, setSelectedIcon
  },
})
```

As in Task 1, treat this as a placeholder to **replace**, not extend.

### Step 2 — Define The State Shape

Rewrite [`src/store/slices/desktopSlice.ts`](../../../../src/store/slices/desktopSlice.ts) from
scratch. Start with the type layer; write no reducer bodies yet. (Imports are omitted throughout
these blocks — deduce them as you did in Task 1. One new import family arrives in Step 4.)

```ts
// ─── Types ──────────────────────────────────────────────────────────────────

export interface GridCell {
  column: number
  row: number
}

// The slice stores ONLY the dynamic facts about an icon: where it is now, and
// where it started. Static metadata (label, image, which window it opens) lives
// in the in-repo registry (Task 17) and is looked up by id at render time —
// never duplicated into Redux.
export interface DesktopIcon {
  id: string
  position: GridCell // current cell — the only field mutated after registration
  defaultPosition: GridCell // frozen seed — written once, enables an exact reset
}

// Note: EXPORTED for test files only. Application code goes through the
// selectors below — never read state.desktop.* directly.
export interface DesktopState {
  iconsById: Record<string, DesktopIcon> // O(1) lookup, mirrors windowSlice.byId
  iconIds: string[] // stable registration order for rendering
  selectedIconId: string | null // single-selection model
  persistPositions: boolean // role-derived: is the current layout durable?
}

// ─── Initial State ──────────────────────────────────────────────────────────
// No icons until the desktop mounts and dispatches registerIcon for each.
// persistPositions starts false — no session yet, so treat the layout as
// ephemeral until a setSession tells us otherwise.

const initialState: DesktopState = {
  iconsById: {},
  iconIds: [],
  selectedIconId: null,
  persistPositions: false,
}
```

### Step 3 — Implement The Reducer Family

Each body is a TODO. Reuse the Task 1 patterns: the `if (!icon) return` idempotent guard, the
Immer mutation style, the "no DOM, no timers" discipline.

```ts
const desktopSlice = createSlice({
  name: 'desktop',
  initialState,
  reducers: {
    // ── registerIcon ──────────────────────────────────────────────────────
    // Payload: { id: string; defaultPosition: GridCell }
    // Seeds one icon from the in-repo registry at desktop mount.
    // TODO: [Action required by Junior]
    //   1. IDEMPOTENCY (critical): if iconsById[id] already exists, return
    //      immediately. The desktop can remount (route navigation); re-seeding
    //      must NOT clobber a position the user already dragged. This is the
    //      single most important line in this reducer — without it, every
    //      remount snaps icons back to defaults and users lose their layout.
    //   2. Insert { id, position: defaultPosition, defaultPosition } into iconsById.
    //   3. Append id to iconIds (stable registration order).
    registerIcon(/* state, action */) {
      // ...
    },

    // ── setIconPosition ───────────────────────────────────────────────────
    // Payload: { id: string; position: GridCell }
    // Commits a new cell on drop (Task 8 dispatches this).
    // TODO: [Action required by Junior]
    //   1. If iconsById[id] is undefined, return (stale drop after removal).
    //   2. Overwrite position with the payload cell. Do NOT touch defaultPosition.
    //   3. Do NOT clamp or collision-check here — that is the grid's job (Task 8).
    setIconPosition(/* state, action */) {
      // ...
    },

    // ── setSelectedIcon ───────────────────────────────────────────────────
    // Payload: { id: string }
    // TODO: [Action required by Junior]
    //   1. If iconsById[id] is undefined, return (cannot select a ghost).
    //   2. Set selectedIconId = id.
    setSelectedIcon(/* state, action */) {
      // ...
    },

    // ── clearSelection ────────────────────────────────────────────────────
    // No payload. Fired on empty-desktop click / Escape.
    // TODO: [Action required by Junior] — set selectedIconId = null.
    clearSelection(/* state */) {
      // ...
    },

    // ── resetGuestPositions ───────────────────────────────────────────────
    // No payload. Returns every icon to its seed layout and clears selection.
    // Exposed as a standalone reducer so it is (a) explicitly dispatchable and
    // (b) unit-testable in isolation. The cross-slice wiring in Step 4 reuses
    // the SAME logic — factor it into a module-scope helper so you write the
    // reset once. (Hint: a plain `function resetToDefaults(state) {...}` above
    // the slice; call it from here and from the clearSession case.)
    // TODO: [Action required by Junior]
    //   1. For every id in iconIds: set iconsById[id].position to a COPY of its
    //      defaultPosition ({ ...defaultPosition } — never alias the frozen seed).
    //   2. Set selectedIconId = null.
    resetGuestPositions(/* state */) {
      // ...
    },
  },

  // extraReducers added in Step 4.
})

export const {
  registerIcon,
  setIconPosition,
  setSelectedIcon,
  clearSelection,
  resetGuestPositions,
} = desktopSlice.actions
export default desktopSlice.reducer
```

### Step 4 — Wire The Cross-Slice Persistence Boundary (`extraReducers`)

This is the architectural heart of the task. The desktop slice reacts to **two** `sessionSlice`
actions. You will import `setSession` and `clearSession` (action creators) from the session
slice, and — for typing the `setSession` payload — the `AppSession` type from the auth module.
Importing another slice's action creators is expected here; that is how cross-slice reactions are
declared.

Add the `extraReducers` builder callback to the `createSlice` config (alongside `reducers`):

```ts
  extraReducers: (builder) => {
    // ── capture the persistence intent when a session begins ──────────────
    // setSession is the ONLY moment the role is observable to this slice.
    // Translate it immediately into the durability fact this slice cares about.
    // TODO: [Action required by Junior]
    //   builder.addCase(setSession, (state, action) => {
    //     state.persistPositions = (action.payload.role === 'admin')
    //   })
    //   Why a boolean and not the role? The slice's policy is "is the layout
    //   durable?", not "who is logged in." Capture intent, not identity.

    // ── act on session end ────────────────────────────────────────────────
    // clearSession carries no role — that is WHY we captured the flag above.
    // TODO: [Action required by Junior]
    //   builder.addCase(clearSession, (state) => {
    //     1. If persistPositions is false (Guest): reuse the reset helper from
    //        Step 3 — positions ⟵ defaults, selection ⟵ null.
    //        If persistPositions is true (Admin): leave the layout untouched.
    //     2. Always reset persistPositions back to false. The next boot starts
    //        ephemeral until a fresh setSession re-establishes durability.
    //   })
  },
```

Internalize the data flow before writing it:

```
guest:  setSession{role:'guest'} ─▶ persist=false ─▶ move icon ─▶ clearSession ─▶ RESET (pos⟵default, sel⟵null)
admin:  setSession{role:'admin'} ─▶ persist=true  ─▶ move icon ─▶ clearSession ─▶ PRESERVE (layout untouched)
```

### Step 5 — Implement The Selectors

Same three-category taxonomy as Task 1. Component code (Tasks 6–9, 17) reads through these and
never touches `state.desktop.*`.

```ts
// ─── Selectors ────────────────────────────────────────────────────────────

// Category 1 — field access. No memoization.
// TODO: [Action required by Junior] - selectSelectedIconId → state.desktop.selectedIconId
export const selectSelectedIconId = (/* state: RootState */): string | null => {
  return null
}

// Category 2 — O(1) lookup, higher-order (parameterized by id), mirrors selectWindowById.
// Usage: useAppSelector(selectIconById('icon-resume'))
// TODO: [Action required by Junior] - return state.desktop.iconsById[id]
export const selectIconById = (/* id: string */) =>
  (/* state: RootState */): DesktopIcon | undefined => {
    return undefined
  }

// Category 2 — O(1) lookup, but resolved from selectedIconId. Returns a stored
// reference (or undefined when nothing is selected) → plain function, NOT createSelector.
// TODO: [Action required by Junior] - read selectedIconId, return iconsById[that] or undefined
export const selectSelectedIcon = (/* state: RootState */): DesktopIcon | undefined => {
  return undefined
}

// Category 3 — derived array. ids.map allocates a NEW array every call → MUST
// be memoized or every icon subscriber re-renders on unrelated dispatches.
// Returns icons in stable registration order (iconIds order), mirroring selectOpenWindows.
// TODO: [Action required by Junior] - createSelector over (iconsById, iconIds) → ids.map(id => byId[id])
export const selectDesktopIcons = createSelector(
  [
    /* (state: RootState) => state.desktop.iconsById, (state: RootState) => state.desktop.iconIds */
  ],
  (/* iconsById, iconIds */): DesktopIcon[] => {
    return []
  }
)
```

### Step 6 — Write The Unit Test Suite

Create `src/store/slices/desktopSlice.test.ts`. Mirror `windowSlice.test.ts` — same import
pattern, same `rootFrom` helper, same `describe` layout. The new ground here is the
**cross-slice tests**: import `setSession` / `clearSession` from `sessionSlice` and drive them
through the desktop reducer to prove the persistence boundary.

```ts
// import reducer + every action/selector from './desktopSlice'
// import { setSession, clearSession } from '../sessionSlice'  ← drives the boundary
// import type { AppSession } from '@/lib/auth'                ← types the payloads

const INITIAL = {
  iconsById: {},
  iconIds: [],
  selectedIconId: null,
  persistPositions: false,
} // satisfies DesktopState

// rootFrom: selectors only read state.desktop — stub the rest of RootState.
// registerOne helper: seed one icon so tests share a starting state (mirror
// windowSlice.test.ts's openOne convenience).

describe('desktopSlice', () => {
  describe('initial state', () => {
    it('matches the empty desktop shape', () => {
      // TODO: [Action required by Junior] - reducer(undefined, {type:'@@INIT'}) deep-equals INITIAL
    })
  })

  describe('registerIcon', () => {
    it('seeds position from defaultPosition and appends to iconIds', () => {
      // TODO: [Action required by Junior]
    })

    it('is idempotent — re-registering a moved icon does NOT reset its position', () => {
      // TODO: [Action required by Junior]
      // Register icon-a at {0,0}. setIconPosition to {4,2}. registerIcon icon-a AGAIN
      // at {0,0}. Assert position is still {4,2} and iconIds has icon-a only once.
    })
  })

  describe('setIconPosition', () => {
    it('updates position but leaves defaultPosition frozen', () => {
      // TODO: [Action required by Junior]
    })

    it('is a no-op for an unknown id', () => {
      // TODO: [Action required by Junior]
    })
  })

  describe('selection', () => {
    it('setSelectedIcon selects a registered icon; ignores an unknown id', () => {
      // TODO: [Action required by Junior] - cover both the hit and the miss
    })

    it('clearSelection nulls selectedIconId', () => {
      // TODO: [Action required by Junior]
    })
  })

  describe('resetGuestPositions', () => {
    it('returns every icon to its default and clears selection', () => {
      // TODO: [Action required by Junior]
      // Register two icons, move both, select one, reset → both at defaults, selection null.
    })
  })

  describe('persistence boundary (cross-slice)', () => {
    it('GUEST: positions reset when the session is cleared', () => {
      // TODO: [Action required by Junior]
      // setSession(guest) → registerIcon → setIconPosition(moved) → clearSession.
      // Assert the icon is back at its defaultPosition.
      const guest = { role: 'guest', jwt: null, startedAt: 1000 } // satisfies AppSession
    })

    it('ADMIN: positions are preserved when the session is cleared', () => {
      // TODO: [Action required by Junior]
      // setSession(admin) → registerIcon → setIconPosition(moved) → clearSession.
      // Assert the icon is STILL at the moved cell (durable layout).
      const admin = { role: 'admin', jwt: 'jwt', startedAt: 1000 } // satisfies AppSession
    })

    it('resets persistPositions to false after any clear', () => {
      // TODO: [Action required by Junior]
      // setSession(admin) → clearSession → assert a subsequent guest-style clear would reset.
    })
  })

  describe('selectors', () => {
    it('selectSelectedIconId returns the selected id field', () => {
      // TODO: [Action required by Junior]
    })

    it('selectIconById returns the icon or undefined', () => {
      // TODO: [Action required by Junior] - hit and miss
    })

    it('selectSelectedIcon resolves the selected icon, undefined when none', () => {
      // TODO: [Action required by Junior]
    })

    it('selectDesktopIcons returns icons in registration order', () => {
      // TODO: [Action required by Junior]
    })
  })
})
```

Run:

```bash
npx jest src/store/slices/desktopSlice.test.ts
```

Every test must pass before this task moves to `complete/`. Do not loosen an assertion to make it
green — fix the reducer. A failing `persistence boundary` test means your Step 4 wiring is wrong;
a failing `idempotent` test means your `registerIcon` guard is missing.

### Step 7 — Confirm Redux DevTools See The New Shape

1. `npm run dev`, open Redux DevTools, inspect the `desktop` slice:
   ```json
   {
     "iconsById": {},
     "iconIds": [],
     "selectedIconId": null,
     "persistPositions": false
   }
   ```
2. Dispatch `{ "type": "desktop/registerIcon", "payload": { "id": "icon-a", "defaultPosition": { "column": 0, "row": 0 } } }`.
   Confirm `iconsById["icon-a"]` exists with `position` **and** `defaultPosition` equal to `{0,0}`.
3. Dispatch `{ "type": "desktop/setIconPosition", "payload": { "id": "icon-a", "position": { "column": 4, "row": 2 } } }`.
   Confirm `position` is `{4,2}` and `defaultPosition` is **still** `{0,0}`.
4. Dispatch `{ "type": "session/setSession", "payload": { "role": "guest", "jwt": null, "startedAt": 1000 } }`.
   Confirm `desktop.persistPositions` flipped to `false` (guest).
5. Dispatch `{ "type": "session/clearSession" }`. Confirm `icon-a.position` snapped back to `{0,0}`.
6. Repeat 2–5 with `"role": "admin"` at step 4. Confirm at step 5 the position **stays** at `{4,2}`.

If any branch behaves differently, you have a Step 4 bug — fix it before moving on.

### Step 8 — Delete The Phase 0 Comment Stubs

Remove the obsolete forward-looking comments left by the scaffold:

```ts
// Phase 2: will hold icon positions, selected icon
// Phase 2: setIconPosition, setSelectedIcon
```

The rewritten slice is self-documenting; stale phase-forward comments are exactly the rot
`CLAUDE.md`'s "Don't add comments" rule targets.

---

## 📝 Validation Report

```
## Task 2 — Desktop Slice Validation Checklist

| #   | Check                                                                                   | Status |
| --- | --------------------------------------------------------------------------------------- | ------ |
| 1   | `DesktopState` = iconsById, iconIds, selectedIconId, persistPositions |   ✅   |
| 2   | `DesktopIcon` carries position AND a write-once defaultPosition; positions are GridCells  |   ✅   |
| 3   | All 5 reducers implemented (registerIcon, setIconPosition, setSelectedIcon, clearSelection, resetGuestPositions) | ✅ |
| 4   | `registerIcon` is idempotent — re-registering does not clobber a moved position           |   ✅   |
| 5   | `extraReducers` reacts to BOTH setSession (capture flag) and clearSession (act) via builder.addCase | ✅ |
| 6   | Guest clear resets to defaults; Admin clear preserves the layout (role-boundary)          |   ✅   |
| 7   | All 4 selectors implemented; only selectDesktopIcons uses createSelector                   |   ✅   |
| 8   | `npx tsc --noEmit` is clean                                                                |   ✅   |
| 9  | `npx jest src/store/slices/desktopSlice.test.ts` — every test passes, incl. role-boundary  |   ✅ 15/15  |
| 10  | Redux DevTools sequence (Step 7) reproduces the documented guest/admin branch behavior     |   ⏸️ manual  |
| 11  | Phase 0 `// Phase 2: ...` comment stubs removed                                            |   ✅   |
| 12  | `npm run lint` clean (no-console, curly, import/order, no-unused-vars)                      |   ✅   |

Validated by: Cade
Validated on: 2026-06-04
```

---

## 🛡️ Summary

The three things an interviewer would probe in this slice:

- **Store the semantic value, derive the presentational one.** Icons snap, so the canonical state
  is a `{column,row}` **cell**; pixels are a render-time projection (Task 8). A frozen
  `defaultPosition` per icon makes "reset to default layout" an exact integer assignment — the
  same snapshot-to-restore idea as `windowSlice`'s `prevGeometry`.
- **Cross-slice reactions belong in `extraReducers`, not components.** The persistence boundary
  ("Guest resets, Admin persists on session end") is enforced inside `desktopSlice` via
  `builder.addCase(clearSession, …)`, so no caller can forget the rule. RTK's installed major
  version supports only the **builder-callback** form of `extraReducers`.
- **Reducer isolation forces capturing intent early.** A reducer sees only its own slice + the
  action, and `clearSession` carries no role. So the slice listens to `setSession` to capture a
  role-derived `persistPositions` boolean — _intent, not identity_ — and branches on that at
  clear-time. The whole boundary stays a pure, synchronously testable `reducer(state, action)`,
  which is why the alternative (`createListenerMiddleware`) is overkill for one boolean.

Idempotent `registerIcon` (remount-safe), the unchanged three-category selector taxonomy, and the
"state not behavior" discipline (no grid math, no DOM, no asset resolution in the slice) round out
the task.
