import reducer, {
  registerIcon,
  setIconPosition,
  setSelectedIcon,
  clearSelection,
  resetGuestPositions,
  selectSelectedIconId,
  selectIconById,
  selectSelectedIcon,
  selectDesktopIcons,
  type DesktopIcon,
  type DesktopState,
  type GridCell,
} from './desktopSlice'
import { setSession, clearSession } from './sessionSlice'
import type { AppSession } from '@/lib/auth'
import type { RootState } from '@/store'

const INITIAL = {
  iconsById: {},
  iconIds: [],
  selectedIconId: null,
  persistPositions: false,
} satisfies DesktopState

// Selectors only read state.desktop, so the rest of RootState can be a stub
// (mirrors rootFrom in windowSlice.test.ts).
const rootFrom = (desktop: DesktopState): RootState => ({ desktop }) as unknown as RootState

const cell = (column: number, row: number): GridCell => ({ column, row })

// Build a DesktopIcon whose current cell starts ON its default — the natural
// shape an icon has at registration time. Pass a different `position` only when
// a test needs a payload that disagrees with the default (e.g. setIconPosition).
const makeIcon = (id: string, position: GridCell = cell(0, 0)): DesktopIcon => ({
  id,
  position,
  defaultPosition: position,
})

// Seed one icon so tests share a starting state (mirrors windowSlice's openOne).
const registerOne = (
  state: DesktopState = INITIAL,
  id = 'icon-a',
  defaultPosition: GridCell = cell(0, 0)
): DesktopState => reducer(state, registerIcon(makeIcon(id, defaultPosition)))

describe('desktopSlice', () => {
  describe('initial state', () => {
    it('matches the empty desktop shape', () => {
      expect(reducer(undefined, { type: '@@INIT' })).toEqual(INITIAL)
    })
  })

  describe('registerIcon', () => {
    it('seeds position from defaultPosition and appends to iconIds', () => {
      const next = registerOne(INITIAL, 'icon-a', cell(2, 3))
      expect(next.iconsById['icon-a'].position).toEqual(cell(2, 3))
      expect(next.iconsById['icon-a'].defaultPosition).toEqual(cell(2, 3))
      expect(next.iconIds).toEqual(['icon-a'])
    })

    it('is idempotent — re-registering a moved icon does NOT reset its position', () => {
      // Register icon-a at {0,0}. setIconPosition to {4,2}. registerIcon icon-a AGAIN
      // at {0,0}. Assert position is still {4,2} and iconIds has icon-a only once.
      let state = registerOne(INITIAL, 'icon-a', cell(0, 0))
      state = reducer(state, setIconPosition({ id: 'icon-a', position: cell(4, 2) }))
      state = reducer(state, registerIcon(makeIcon('icon-a', cell(0, 0))))
      expect(state.iconsById['icon-a'].position).toEqual(cell(4, 2))
      expect(state.iconIds).toEqual(['icon-a'])
    })
  })

  describe('setIconPosition', () => {
    it('updates position but leaves defaultPosition frozen', () => {
      let state = registerOne(INITIAL, 'icon-a', cell(1, 1))
      state = reducer(state, setIconPosition({ id: 'icon-a', position: cell(5, 6) }))
      expect(state.iconsById['icon-a'].position).toEqual(cell(5, 6))
      expect(state.iconsById['icon-a'].defaultPosition).toEqual(cell(1, 1))
    })

    it('is a no-op for an unknown id', () => {
      const state = registerOne(INITIAL, 'icon-a', cell(1, 1))
      const next = reducer(state, setIconPosition({ id: 'icon-z', position: cell(9, 9) }))
      expect(next).toBe(state)
      expect(next.iconsById['icon-z']).toBeUndefined()
    })
  })

  describe('selection', () => {
    it('setSelectedIcon selects a registered icon; ignores an unknown id', () => {
      let state = registerOne(INITIAL, 'icon-a')
      // hit — a registered icon becomes the selection
      state = reducer(state, setSelectedIcon({ id: 'icon-a' }))
      expect(state.selectedIconId).toBe('icon-a')
      // miss — an unknown id leaves the existing selection untouched
      const after = reducer(state, setSelectedIcon({ id: 'icon-z' }))
      expect(after.selectedIconId).toBe('icon-a')
    })

    it('clearSelection nulls selectedIconId', () => {
      let state = registerOne(INITIAL, 'icon-a')
      state = reducer(state, setSelectedIcon({ id: 'icon-a' }))
      state = reducer(state, clearSelection())
      expect(state.selectedIconId).toBeNull()
    })
  })

  describe('resetGuestPositions', () => {
    it('returns every icon to its default and clears selection', () => {
      // Register two icons, move both, select one, reset → both at defaults, selection null.
      let state = registerOne(INITIAL, 'icon-a', cell(0, 0))
      state = registerOne(state, 'icon-b', cell(1, 0))
      state = reducer(state, setIconPosition({ id: 'icon-a', position: cell(4, 4) }))
      state = reducer(state, setIconPosition({ id: 'icon-b', position: cell(5, 5) }))
      state = reducer(state, setSelectedIcon({ id: 'icon-a' }))

      state = reducer(state, resetGuestPositions())

      expect(state.iconsById['icon-a'].position).toEqual(cell(0, 0))
      expect(state.iconsById['icon-b'].position).toEqual(cell(1, 0))
      expect(state.selectedIconId).toBeNull()
    })
  })

  describe('persistence boundary (cross-slice)', () => {
    it('GUEST: positions reset when the session is cleared', () => {
      // setSession(guest) → registerIcon → setIconPosition(moved) → clearSession.
      // Assert the icon is back at its defaultPosition.
      const guest: AppSession = { role: 'guest', jwt: null, startedAt: 1000 }
      let state = reducer(INITIAL, setSession(guest))
      state = registerOne(state, 'icon-a', cell(0, 0))
      state = reducer(state, setIconPosition({ id: 'icon-a', position: cell(3, 3) }))
      state = reducer(state, clearSession())
      expect(state.iconsById['icon-a'].position).toEqual(cell(0, 0))
    })

    it('ADMIN: positions are preserved when the session is cleared', () => {
      // setSession(admin) → registerIcon → setIconPosition(moved) → clearSession.
      // Assert the icon is STILL at the moved cell (durable layout).
      const admin: AppSession = { role: 'admin', jwt: 'jwt', startedAt: 1000 }
      let state = reducer(INITIAL, setSession(admin))
      state = registerOne(state, 'icon-a', cell(0, 0))
      state = reducer(state, setIconPosition({ id: 'icon-a', position: cell(3, 3) }))
      state = reducer(state, clearSession())
      expect(state.iconsById['icon-a'].position).toEqual(cell(3, 3))
    })

    it('resets persistPositions to false after any clear', () => {
      // setSession(admin) → clearSession → assert a subsequent guest-style clear would reset.
      const admin: AppSession = { role: 'admin', jwt: 'jwt', startedAt: 1000 }
      let state = reducer(INITIAL, setSession(admin))
      state = registerOne(state, 'icon-a', cell(0, 0))
      state = reducer(state, setIconPosition({ id: 'icon-a', position: cell(3, 3) }))

      // First clear: admin layout survives, but durability is spent.
      state = reducer(state, clearSession())
      expect(state.persistPositions).toBe(false)
      expect(state.iconsById['icon-a'].position).toEqual(cell(3, 3))

      // Second clear with no fresh setSession now behaves guest-style → reset.
      state = reducer(state, clearSession())
      expect(state.iconsById['icon-a'].position).toEqual(cell(0, 0))
    })
  })

  describe('selectors', () => {
    it('selectSelectedIconId returns the selected id field', () => {
      let state = registerOne(INITIAL, 'icon-a')
      expect(selectSelectedIconId(rootFrom(state))).toBeNull()
      state = reducer(state, setSelectedIcon({ id: 'icon-a' }))
      expect(selectSelectedIconId(rootFrom(state))).toBe('icon-a')
    })

    it('selectIconById returns the icon or undefined', () => {
      const state = registerOne(INITIAL, 'icon-a', cell(2, 2))
      expect(selectIconById('icon-a')(rootFrom(state))).toEqual(state.iconsById['icon-a'])
      expect(selectIconById('icon-z')(rootFrom(state))).toBeUndefined()
    })

    it('selectSelectedIcon resolves the selected icon, undefined when none', () => {
      let state = registerOne(INITIAL, 'icon-a')
      expect(selectSelectedIcon(rootFrom(state))).toBeUndefined()
      state = reducer(state, setSelectedIcon({ id: 'icon-a' }))
      expect(selectSelectedIcon(rootFrom(state))).toEqual(state.iconsById['icon-a'])
    })

    it('selectDesktopIcons returns icons in registration order', () => {
      let state = registerOne(INITIAL, 'icon-a', cell(0, 0))
      state = registerOne(state, 'icon-b', cell(1, 0))
      state = registerOne(state, 'icon-c', cell(2, 0))
      const ids = selectDesktopIcons(rootFrom(state)).map((icon) => icon.id)
      expect(ids).toEqual(['icon-a', 'icon-b', 'icon-c'])
    })
  })
})
