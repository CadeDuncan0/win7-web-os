import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { AppSession } from '@/lib/auth'
import type { RootState } from '@/store'

// ─── Types ──────────────────────────────────────────────────────────────────

export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated'
export interface SessionState {
  role: 'guest' | 'admin' | null
  authStatus: AuthStatus
  jwt: string | null
  startedAt: number | null
}

// ─── Initial State ──────────────────────────────────────────────────────────

const initialState: SessionState = {
  role: null,
  authStatus: 'unknown',
  jwt: null,
  startedAt: null,
}

// ─── Slice ──────────────────────────────────────────────────────────────────

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<AppSession>) {
      state.authStatus = 'authenticated'
      state.jwt = action.payload.jwt
      state.role = action.payload.role
      state.startedAt = action.payload.startedAt
    },

    clearSession(state) {
      state.authStatus = 'unauthenticated'
      state.jwt = null
      state.role = null
      state.startedAt = null
    },
  },
})

export const { setSession, clearSession } = sessionSlice.actions
export default sessionSlice.reducer

// ─── Selectors ──────────────────────────────────────────────────────────────
// Every component and every Apollo link reads through these — never through state.session.* directly.

export const selectRole = (state: RootState): 'guest' | 'admin' | null => {
  return state.session.role
}

export const selectAuthStatus = (state: RootState): AuthStatus => {
  return state.session.authStatus
}

export const selectJwt = (state: RootState): string | null => {
  return state.session.jwt
}

export const selectIsAdmin = (state: RootState): boolean => {
  return state.session.role === 'admin'
}
