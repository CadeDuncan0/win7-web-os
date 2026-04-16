import { createSlice } from '@reduxjs/toolkit'

interface SessionState {
  // Phase 1: will hold role ('guest' | 'admin'), auth status, JWT
  role: 'guest' | 'admin'
  authStatus: 'authenticated' | 'unauthenticated'
  jwt: string
}

const initialState: SessionState = {
  role: 'guest',
  authStatus: 'unauthenticated',
  jwt: '',
}

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    // Phase 1: setSession, clearSession
  },
})

export default sessionSlice.reducer
