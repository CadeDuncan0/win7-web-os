// Tests verify Redux wiring: state reading, inline style application,
// active/inactive derivation, title-bar control dispatches, and focus promotion.

import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ManagedWindow } from './ManagedWindow'
import type { RootState } from '@/store'
import { renderWithProviders } from '@/test-utils/renderWithProviders'

const SINGLE_WINDOW: Partial<RootState> = {
  window: {
    byId: {
      'win-1': {
        id: 'win-1',
        kind: 'welcome',
        title: 'Test Window',
        position: { x: 100, y: 50 },
        size: { width: 400, height: 300 },
        zIndex: 1,
        isMinimized: false,
        isMaximized: false,
        prevGeometry: null,
      },
    },
    ids: ['win-1'],
    zCounter: 1,
    nextIdSeed: 1,
  },
}

// win-1 is behind win-2 — win-1 should render as inactive
const TWO_WINDOWS: Partial<RootState> = {
  window: {
    byId: {
      'win-1': {
        id: 'win-1',
        kind: 'welcome',
        title: 'Back Window',
        position: { x: 80, y: 40 },
        size: { width: 400, height: 300 },
        zIndex: 1,
        isMinimized: false,
        isMaximized: false,
        prevGeometry: null,
      },
      'win-2': {
        id: 'win-2',
        kind: 'welcome',
        title: 'Front Window',
        position: { x: 200, y: 100 },
        size: { width: 400, height: 300 },
        zIndex: 2,
        isMinimized: false,
        isMaximized: false,
        prevGeometry: null,
      },
    },
    ids: ['win-1', 'win-2'],
    zCounter: 2,
    nextIdSeed: 2,
  },
}

const MAXIMIZED_WINDOW: Partial<RootState> = {
  window: {
    byId: {
      'win-1': {
        id: 'win-1',
        kind: 'welcome',
        title: 'Maximized Window',
        position: { x: 0, y: 0 },
        size: { width: 1280, height: 680 },
        zIndex: 1,
        isMinimized: false,
        isMaximized: true,
        prevGeometry: { x: 100, y: 50, width: 400, height: 300 },
      },
    },
    ids: ['win-1'],
    zCounter: 1,
    nextIdSeed: 1,
  },
}

describe('ManagedWindow', () => {
  it('renders the window title from Redux state', () => {
    renderWithProviders(<ManagedWindow windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    expect(screen.getByText('Test Window')).toBeInTheDocument()
  })

  it('renders nothing when windowId does not exist in state', () => {
    const { container } = renderWithProviders(<ManagedWindow windowId="win-999" />, {
      preloadedState: SINGLE_WINDOW,
    })

    expect(container.innerHTML).toBe('')
  })

  it('applies position and size from Redux as inline styles', () => {
    renderWithProviders(<ManagedWindow windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    const wrapper = screen.getByTestId('managed-window-win-1')
    expect(wrapper.style.left).toBe('100px')
    expect(wrapper.style.top).toBe('50px')
    expect(wrapper.style.width).toBe('400px')
    expect(wrapper.style.height).toBe('300px')
  })

  it('applies zIndex from Redux state', () => {
    renderWithProviders(<ManagedWindow windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    const wrapper = screen.getByTestId('managed-window-win-1')
    expect(wrapper.style.zIndex).toBe('1')
  })

  it('passes active=true when window is the top window', () => {
    const { container } = renderWithProviders(<ManagedWindow windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    expect(container.querySelector('.window.active')).not.toBeNull()
  })

  it('passes active=false when another window is on top', () => {
    const { container } = renderWithProviders(<ManagedWindow windowId="win-1" />, {
      preloadedState: TWO_WINDOWS,
    })

    // win-1 has zIndex 1, win-2 has zIndex 2 — win-1 should NOT be active
    const windowEl = container.querySelector('.window')
    expect(windowEl).not.toBeNull()
    expect(windowEl!.classList.contains('active')).toBe(false)
  })

  it('dispatches closeWindow when Close button is clicked', async () => {
    const user = userEvent.setup()
    const { store } = renderWithProviders(<ManagedWindow windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(store.getState().window.byId['win-1']).toBeUndefined()
    expect(store.getState().window.ids).not.toContain('win-1')
  })

  it('dispatches minimizeWindow when Minimize button is clicked', async () => {
    const user = userEvent.setup()
    const { store } = renderWithProviders(<ManagedWindow windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    await user.click(screen.getByRole('button', { name: 'Minimize' }))

    expect(store.getState().window.byId['win-1'].isMinimized).toBe(true)
  })

  it('dispatches toggleMaximize when Maximize button is clicked', async () => {
    const user = userEvent.setup()
    const { store } = renderWithProviders(<ManagedWindow windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    await user.click(screen.getByRole('button', { name: 'Maximize' }))

    expect(store.getState().window.byId['win-1'].isMaximized).toBe(true)
  })

  it('shows Restore button when window is maximized', () => {
    renderWithProviders(<ManagedWindow windowId="win-1" />, {
      preloadedState: MAXIMIZED_WINDOW,
    })

    expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Maximize' })).not.toBeInTheDocument()
  })

  it('dispatches focusWindow on pointerdown', () => {
    const { store } = renderWithProviders(<ManagedWindow windowId="win-1" />, {
      preloadedState: TWO_WINDOWS,
    })

    const wrapper = screen.getByTestId('managed-window-win-1')
    fireEvent.pointerDown(wrapper)

    // win-1 was at zIndex 1, zCounter was 2 — after focus, zCounter bumps to 3
    expect(store.getState().window.byId['win-1'].zIndex).toBe(3)
  })
})
