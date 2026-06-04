import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit'

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

const desktopSlice = createSlice({
  name: 'desktop',
  initialState,
  reducers: {
    // ── registerIcon ──────────────────────────────────────────────────────
    // Payload: { id: string; defaultPosition: GridCell }
    // Seeds one icon from the in-repo registry at desktop mount.
    registerIcon(state, action: PayloadAction<DesktopIcon>) {
      // ...
      if (state.iconsById[action.payload.id]) {
        return
      }
      state.iconsById[action.payload.id] = action.payload
      state.iconIds.push(action.payload.id)
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

    // ── setWallpaper ──────────────────────────────────────────────────────
    // Payload: { wallpaper: string }
    // TODO: [Action required by Junior] — set state.wallpaper from the payload.
    // The slice does not validate the id against the asset set — that coupling
    // belongs to the wallpaper registry (Task 6).
    setWallpaper(/* state, action */) {
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
  //extraReducers: (builder) => {
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
  //},
})

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

export const {
  registerIcon,
  setIconPosition,
  setSelectedIcon,
  clearSelection,
  resetGuestPositions,
} = desktopSlice.actions

export default desktopSlice.reducer
