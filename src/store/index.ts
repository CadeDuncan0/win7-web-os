import { configureStore } from '@reduxjs/toolkit'

import desktopReducer from './slices/desktopSlice'
import sessionReducer from './slices/sessionSlice'
import windowReducer from './slices/windowSlice'

export const store = configureStore({
  reducer: {
    window: windowReducer,
    session: sessionReducer,
    desktop: desktopReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
