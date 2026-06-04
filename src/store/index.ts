import { combineReducers, configureStore } from '@reduxjs/toolkit'

import desktopReducer from './slices/desktopSlice'
import sessionReducer from './slices/sessionSlice'
import windowReducer from './slices/windowSlice'

const rootReducer = combineReducers({
  window: windowReducer,
  session: sessionReducer,
  desktop: desktopReducer,
})

// Store factory. The app mounts the singleton `store` below, but tests need an
// isolated store per test so state never leaks across cases — `setupStore` mints
// a fresh one and accepts `preloadedState` to seed a specific scenario.
export const setupStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  })
}

export const store = setupStore()

export type RootState = ReturnType<typeof rootReducer>
export type AppStore = ReturnType<typeof setupStore>
export type AppDispatch = AppStore['dispatch']
