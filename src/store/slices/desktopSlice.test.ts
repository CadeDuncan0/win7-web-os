import reducer, * as desktopSlice from './desktopSlice'
// import { setSession, clearSession } from './sessionSlice'
// import type { AppSession } from '@/lib/auth'

const INITIAL = {
  iconsById: {},
  iconIds: [],
  selectedIconId: null,
  persistPositions: false,
} satisfies desktopSlice.DesktopState

// rootFrom: selectors only read state.desktop — stub the rest of RootState.
// registerOne helper: seed one icon so tests share a starting state (mirror
// windowSlice.test.ts's openOne convenience).

describe('desktopSlice', () => {
  describe('initial state', () => {
    it('matches the empty desktop shape', () => {
      expect(reducer(undefined, { type: '@@INIT' })).toEqual(INITIAL)
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

  describe('setWallpaper', () => {
    it('replaces the wallpaper id', () => {
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
      //const guest = { role: 'guest', jwt: null, startedAt: 1000 } // satisfies AppSession
    })

    it('ADMIN: positions are preserved when the session is cleared', () => {
      // TODO: [Action required by Junior]
      // setSession(admin) → registerIcon → setIconPosition(moved) → clearSession.
      // Assert the icon is STILL at the moved cell (durable layout).
      //const admin = { role: 'admin', jwt: 'jwt', startedAt: 1000 } // satisfies AppSession
    })

    it('resets persistPositions to false after any clear', () => {
      // TODO: [Action required by Junior]
      // setSession(admin) → clearSession → assert a subsequent guest-style clear would reset.
    })
  })

  describe('selectors', () => {
    it('selectWallpaper / selectSelectedIconId return their fields', () => {
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
