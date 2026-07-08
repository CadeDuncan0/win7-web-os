import { combineReducers, configureStore } from '@reduxjs/toolkit'

import desktopReducer from './slices/desktopSlice'
import sessionReducer from './slices/sessionSlice'
import windowReducer from './slices/windowSlice'

const rootReducer = combineReducers({
  window: windowReducer,
  session: sessionReducer,
  desktop: desktopReducer,
})

// Store factory — the ONLY way a store comes into existence. There is no
// module-level singleton: `ReduxProviderWrapper` mints one store per
// request/mount (so SSR passes never share state across requests), and tests
// mint an isolated store per case, seeding scenarios via `preloadedState`.
export const setupStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  })
}

export type RootState = ReturnType<typeof rootReducer>
export type AppStore = ReturnType<typeof setupStore>
export type AppDispatch = AppStore['dispatch']
