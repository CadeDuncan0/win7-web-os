import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit'

import type { RootState } from '@/store'
import { setSession, clearSession } from '@/store/slices/sessionSlice'

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

function resetDesktopIcons(state: DesktopState): void {
  state.iconIds.forEach((iconId) => {
    const desktopIcon = state.iconsById[iconId]
    desktopIcon.position = { ...desktopIcon.defaultPosition }
  })
}

const desktopSlice = createSlice({
  name: 'desktop',
  initialState,
  reducers: {
    // ── registerIcon ──────────────────────────────────────────────────────
    registerIcon(state, action: PayloadAction<DesktopIcon>) {
      if (state.iconsById[action.payload.id]) {
        return
      }
      state.iconsById[action.payload.id] = action.payload
      state.iconIds.push(action.payload.id)
    },

    // ── setIconPosition ───────────────────────────────────────────────────
    setIconPosition(state, action: PayloadAction<{ id: string; position: GridCell }>) {
      const icon = state.iconsById[action.payload.id]
      if (!icon) {
        return
      }
      icon.position = action.payload.position
    },

    // ── setSelectedIcon ───────────────────────────────────────────────────
    setSelectedIcon(state, action: PayloadAction<{ id: string }>) {
      const icon = state.iconsById[action.payload.id]
      if (!icon) {
        return
      }
      state.selectedIconId = action.payload.id
    },

    // ── clearSelection ────────────────────────────────────────────────────
    clearSelection(state) {
      state.selectedIconId = null
    },

    // ── resetGuestPositions ───────────────────────────────────────────────
    resetGuestPositions(state) {
      resetDesktopIcons(state)
      state.selectedIconId = null
    },
  },

  // extraReducers added in Step 4.
  extraReducers: (builder) => {
    // ── capture the persistence intent when a session begins ──────────────
    // setSession is the ONLY moment the role is observable to this slice.
    // Translate it immediately into the durability fact this slice cares about.
    builder.addCase(setSession, (state, action) => {
      state.persistPositions = action.payload.role === 'admin'
    })

    builder.addCase(clearSession, (state) => {
      // 1. If persistPositions is false (Guest): reuse the reset helper from
      //    Step 3 — positions ⟵ defaults, selection ⟵ null.
      //    If persistPositions is true (Admin): leave the layout untouched.
      if (!state.persistPositions) {
        resetDesktopIcons(state)
      }
      // 2. Always reset persistPositions back to false. The next boot starts
      //    ephemeral until a fresh setSession re-establishes durability.
      state.persistPositions = false
    })
  },
})

// ─── Selectors ────────────────────────────────────────────────────────────

// Category 1 — field access. No memoization.
export const selectSelectedIconId = (state: RootState): string | null => {
  return state.desktop.selectedIconId
}

// Category 2 — O(1) lookup, higher-order (parameterized by id), mirrors selectWindowById.
// Usage: useAppSelector(selectIconById('icon-resume'))
export const selectIconById =
  (id: string) =>
  (state: RootState): DesktopIcon | undefined => {
    return state.desktop.iconsById[id]
  }

// Category 2 — O(1) lookup, but resolved from selectedIconId. Returns a stored
// reference (or undefined when nothing is selected) → plain function, NOT createSelector.
export const selectSelectedIcon = (state: RootState): DesktopIcon | undefined => {
  return state.desktop.selectedIconId
    ? state.desktop.iconsById[state.desktop.selectedIconId]
    : undefined
}

// Category 3 — derived array. ids.map allocates a NEW array every call → MUST
// be memoized or every icon subscriber re-renders on unrelated dispatches.
// Returns icons in stable registration order (iconIds order), mirroring selectOpenWindows.
export const selectDesktopIcons = createSelector(
  [(state: RootState) => state.desktop.iconsById, (state: RootState) => state.desktop.iconIds],
  (iconsById, iconIds): DesktopIcon[] => {
    return iconIds.map((id) => iconsById[id])
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
