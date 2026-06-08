import reducer, {
  setSession,
  clearSession,
  selectRole,
  selectAuthStatus,
  selectJwt,
  selectIsAdmin,
  type SessionState,
} from './sessionSlice'
import type { AppSession } from '@/lib/auth'
import type { RootState } from '@/store'

const INITIAL: SessionState = {
  role: null,
  authStatus: 'unknown',
  jwt: null,
  startedAt: null,
}

// Helper to wrap a SessionState into something the selectors can consume.
// We only need the .session slice — the rest of RootState is irrelevant here.
const rootFrom = (session: SessionState): RootState => ({ session }) as unknown as RootState

describe('sessionSlice', () => {
  it('has the correct initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(INITIAL)
  })

  describe('setSession', () => {
    it('applies an admin session', () => {
      const testSession = {
        role: 'admin',
        jwt: 'abc',
        startedAt: 1000,
      } satisfies AppSession

      const testState = reducer(undefined, setSession(testSession))

      expect(testState.authStatus).toEqual('authenticated')
      expect(testState.jwt).toEqual('abc')
      expect(testState.role).toEqual('admin')
      expect(testState.startedAt).toEqual(1000)
    })

    it('applies a guest session', () => {
      const testSession = {
        role: 'guest',
        jwt: null,
        startedAt: 1000,
      } satisfies AppSession

      const testState = reducer(undefined, setSession(testSession))

      expect(testState.authStatus).toEqual('authenticated')
      expect(testState.jwt).toEqual(null)
      expect(testState.role).toEqual('guest')
      expect(testState.startedAt).toEqual(1000)
    })
  })

  describe('clearSession', () => {
    it('resets role/jwt/startedAt and sets authStatus to unauthenticated (NOT unknown)', () => {
      const testPayload = {
        role: 'admin',
        jwt: 'abc',
        startedAt: 1000,
      } satisfies AppSession

      const startState = reducer(undefined, setSession(testPayload))
      const testState = reducer(startState, clearSession())

      expect(testState.authStatus).toEqual('unauthenticated')
      expect(testState.jwt).toEqual(null)
      expect(testState.role).toEqual(null)
      expect(testState.startedAt).toEqual(null)
    })
  })

  describe('selectors', () => {
    it('selectRole, selectAuthStatus, selectJwt return the correct field', () => {
      const testPayload = {
        role: 'admin',
        jwt: 'test',
        startedAt: 1234,
      } satisfies AppSession

      const testState = reducer(undefined, setSession(testPayload))
      const testRootState = rootFrom(testState)

      expect(selectAuthStatus(testRootState)).toEqual('authenticated')
      expect(selectJwt(testRootState)).toEqual('test')
      expect(selectRole(testRootState)).toEqual('admin')
    })

    it('selectIsAdmin returns true only when role is admin', () => {
      // role = 'admin'
      let testPayload: AppSession = {
        role: 'admin',
        jwt: 'test',
        startedAt: 1000,
      }
      let testState = reducer(undefined, setSession(testPayload))
      let testRootState = rootFrom(testState)

      expect(selectIsAdmin(testRootState)).toEqual(true)

      // role = 'guest'
      testPayload = {
        role: 'guest',
        jwt: null,
        startedAt: 1000,
      }

      testState = reducer(undefined, setSession(testPayload))
      testRootState = rootFrom(testState)

      expect(selectIsAdmin(testRootState)).toEqual(false)

      // role = null
      testState = reducer(testState, clearSession())
      testRootState = rootFrom(testState)

      expect(selectIsAdmin(testRootState)).toEqual(false)
    })
  })
})
