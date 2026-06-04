import { MockedProvider, type MockedProviderProps } from '@apollo/client/testing/react'
import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { Provider } from 'react-redux'

import { setupStore, type AppStore, type RootState } from '@/store'

// Apollo's MockedProvider types `mocks` for us — derive from it rather than
// importing MockedResponse directly so this stays correct across Apollo versions.
type ApolloMocks = MockedProviderProps['mocks']

export interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Seed the Redux store for a specific scenario (role, open windows, icons …).
  preloadedState?: Partial<RootState>
  // Supply a pre-built store instead of letting the helper mint one. Useful when
  // a test wants to dispatch before render or share a store across re-renders.
  store?: AppStore
  // GraphQL responses for the components under test. Empty by default — most
  // components don't query, and MockedProvider just provides the Apollo context.
  mocks?: ApolloMocks
}

export interface RenderWithProvidersResult extends RenderResult {
  store: AppStore
}

// Renders `ui` inside the same provider chain the app uses — Redux first so the
// Apollo link chain (and any component) can read session state — but with a
// fresh, isolated store and a network-free Apollo client. Returns RTL's result
// plus the `store`, so a test can dispatch actions and assert on state.
export function renderWithProviders(
  ui: ReactElement,
  options: ExtendedRenderOptions = {}
): RenderWithProvidersResult {
  const {
    preloadedState,
    store = setupStore(preloadedState),
    mocks = [],
    ...renderOptions
  } = options

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <MockedProvider mocks={mocks}>{children}</MockedProvider>
      </Provider>
    )
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}
