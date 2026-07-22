import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit'

import { findNextFreeCell } from '@/lib/gridMath'
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
  // Positions hydrated from sessionStorage (useDesktopPersistence). Kept as a
  // standalone map — not merged into iconsById — because hydration and icon
  // registration race at boot: whichever runs second consults the other.
  savedPositions: Record<string, GridCell>
  // Icons the user hid via the context menu ("Hide icon" / the Show icons
  // toggles). Hidden icons stay registered — their grid cells survive for
  // re-showing — they just don't render. Persisted like positions.
  hiddenIconIds: string[]
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
  savedPositions: {},
  hiddenIconIds: [],
}

function resetDesktopIcons(state: DesktopState): void {
  state.iconIds.forEach((iconId) => {
    const desktopIcon = state.iconsById[iconId]
    desktopIcon.position = { ...desktopIcon.defaultPosition }
  })
}

// Scan down rows from `desired` for the first cell no already-registered icon
// occupies (compared via `cellOf`, so the live layout and the reset layout are
// each kept collision-free). Column-major single-column growth mirrors the seed
// layout; the finite icon count guarantees a free row is found and terminates.
function firstFreeCell(
  desired: GridCell,
  icons: DesktopIcon[],
  cellOf: (icon: DesktopIcon) => GridCell
): GridCell {
  const { column } = desired
  let { row } = desired
  while (icons.some((icon) => cellOf(icon).column === column && cellOf(icon).row === row)) {
    row += 1
  }
  return { column, row }
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
      // Occupancy-aware seeding: an icon never lands on a cell another icon
      // already holds. The seed (or a hydrated position) is only a starting
      // hint — if it is taken we slide to the next free cell. Resolved
      // independently for the live position and the reset default so neither
      // layout can stack, e.g. when a same-tab role switch registers a new icon
      // onto a row a prior role already placed. A hydrated position still wins
      // over the seed as the desired starting cell.
      const registered = state.iconIds.map((id) => state.iconsById[id])
      const defaultPosition = firstFreeCell(
        action.payload.defaultPosition,
        registered,
        (icon) => icon.defaultPosition
      )
      const saved = state.savedPositions[action.payload.id]
      const position = firstFreeCell(
        saved ?? action.payload.position,
        registered,
        (icon) => icon.position
      )
      state.iconsById[action.payload.id] = {
        id: action.payload.id,
        position,
        defaultPosition,
      }
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

    // ── arrangeIcons ──────────────────────────────────────────────────────
    // Payload: icon ids in the desired order + the viewport row bound. Lays the
    // listed icons out column-major (top to bottom, wrapping to the next column
    // at maxRows so none land below the taskbar) in that order — the caller
    // decides the order (e.g. the desktop menu's "Sort by name" sorts registry
    // titles); this slice knows nothing about labels. Only the listed icons
    // move: hidden icons are omitted by the caller, so their cells are freed and
    // reused here — a re-shown icon resolves any resulting overlap
    // (setIconHidden). Unknown ids are skipped without leaving a gap.
    arrangeIcons(state, action: PayloadAction<{ ids: string[]; maxRows: number }>) {
      const { ids, maxRows } = action.payload
      let column = 0
      let row = 0
      ids.forEach((id) => {
        const icon = state.iconsById[id]
        if (!icon) {
          return
        }
        icon.position = { column, row }
        row += 1
        if (row >= maxRows) {
          row = 0
          column += 1
        }
      })
    },

    // ── setIconHidden ─────────────────────────────────────────────────────
    // Payload: { id, hidden, maxRows }. Toggles an icon's user-hidden state
    // (context menu "Hide icon" / Show icons checkboxes). A hidden icon frees
    // its cell, so sorts and manual moves may fill it while the icon is gone.
    // On re-show the old cell may now be taken, so the icon slides to the next
    // free cell among the currently-visible icons (wrapping at maxRows, which is
    // consulted only on this path). Hiding the selected icon drops the selection.
    setIconHidden(state, action: PayloadAction<{ id: string; hidden: boolean; maxRows: number }>) {
      const { id, hidden, maxRows } = action.payload
      if (hidden) {
        if (!state.hiddenIconIds.includes(id)) {
          state.hiddenIconIds.push(id)
        }
        if (state.selectedIconId === id) {
          state.selectedIconId = null
        }
        return
      }
      state.hiddenIconIds = state.hiddenIconIds.filter((hiddenId) => hiddenId !== id)
      const icon = state.iconsById[id]
      if (!icon) {
        return
      }
      const visible = state.iconIds
        .filter((otherId) => otherId !== id && !state.hiddenIconIds.includes(otherId))
        .map((otherId) => state.iconsById[otherId])
      icon.position = findNextFreeCell(icon.position, visible, id, maxRows)
    },

    // ── hydrateHiddenIcons ────────────────────────────────────────────────
    // Payload: the persisted hidden-icon id list. Dispatched once at desktop
    // boot (useDesktopPersistence).
    hydrateHiddenIcons(state, action: PayloadAction<string[]>) {
      state.hiddenIconIds = action.payload
    },

    // ── hydrateIconPositions ──────────────────────────────────────────────
    // Payload: the persisted id → grid-cell map. Dispatched once at desktop
    // boot (useDesktopPersistence). Applies to icons already registered and
    // is kept in savedPositions for icons that register afterwards.
    hydrateIconPositions(state, action: PayloadAction<Record<string, GridCell>>) {
      state.savedPositions = action.payload
      Object.entries(action.payload).forEach(([id, position]) => {
        const icon = state.iconsById[id]
        if (!icon) {
          return
        }
        // Saved cells can collide with cells other icons already hold (e.g. an
        // app added in a later release seeds onto a saved icon's row). Resolve
        // each through the same free-cell scan registration uses, excluding the
        // icon itself so a cell it already occupies stays put.
        const others = state.iconIds
          .filter((otherId) => otherId !== id)
          .map((otherId) => state.iconsById[otherId])
        icon.position = firstFreeCell(position, others, (other) => other.position)
      })
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
      //    Step 3 — positions ⟵ defaults, selection ⟵ null, hidden icons
      //    restored. If persistPositions is true (Admin): leave the layout
      //    untouched.
      if (!state.persistPositions) {
        resetDesktopIcons(state)
        state.hiddenIconIds = []
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

// Category 2 — returns the stored reference; consumed by useDesktopPersistence
// to change-detect (by identity) and write positions through to sessionStorage.
export const selectIconsById = (state: RootState): Record<string, DesktopIcon> => {
  return state.desktop.iconsById
}

// Category 2 — returns the stored reference; consumed by the desktop context
// menu (checkbox state) and useDesktopPersistence (identity change-detect).
export const selectHiddenIconIds = (state: RootState): string[] => {
  return state.desktop.hiddenIconIds
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
  arrangeIcons,
  setIconHidden,
  hydrateHiddenIcons,
  hydrateIconPositions,
} = desktopSlice.actions

export default desktopSlice.reducer
