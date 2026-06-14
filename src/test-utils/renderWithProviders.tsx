import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { Provider } from 'react-redux'

import { setupStore, type AppStore, type RootState } from '@/store'

export interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Seed the Redux store for a specific scenario (role, open windows, icons …).
  preloadedState?: Partial<RootState>
  // Supply a pre-built store instead of letting the helper mint one. Useful when
  // a test wants to dispatch before render or share a store across re-renders.
  store?: AppStore
}

export interface RenderWithProvidersResult extends RenderResult {
  store: AppStore
}

// Renders `ui` inside the same provider chain the app uses — the Redux store —
// with a fresh, isolated store per call. Returns RTL's result plus the `store`,
// so a test can dispatch actions and assert on state.
export function renderWithProviders(
  ui: ReactElement,
  options: ExtendedRenderOptions = {}
): RenderWithProvidersResult {
  const { preloadedState, store = setupStore(preloadedState), ...renderOptions } = options

  function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}
