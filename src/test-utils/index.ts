// Single import surface for component tests. Re-exports the React Testing
// Library API (screen, waitFor, within, fireEvent, …) alongside the custom
// provider-aware render so a test only ever imports from '@/test-utils'.
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

export { renderWithProviders } from './renderWithProviders'
export type { ExtendedRenderOptions, RenderWithProvidersResult } from './renderWithProviders'
