import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import DesktopPage from './page'
import { WindowManager } from '@/components/screens/desktop/WindowManager'
import type { RootState } from '@/store'
import { renderWithProviders } from '@/test-utils'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

vi.mock('@/lib/auth', () => ({
  signOut: vi.fn().mockResolvedValue(undefined),
}))

describe('DesktopPage', () => {
  it('renders the desktop shell', () => {
    renderWithProviders(<DesktopPage />)
    expect(screen.getByRole('main', { name: /desktop/i })).toBeInTheDocument()
  })

  it('renders the icon grid with desktop icons', () => {
    renderWithProviders(<DesktopPage />)
    expect(screen.getByTestId('icon-grid')).toBeInTheDocument()

    const expectedLabels = ['Internet Explorer', 'Welcome', 'Getting Started']
    for (const label of expectedLabels) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('renders the taskbar', () => {
    renderWithProviders(<DesktopPage />)
    expect(screen.getByRole('navigation', { name: /taskbar/i })).toBeInTheDocument()
  })

  it('does not render a standalone Sign Out button', () => {
    renderWithProviders(<DesktopPage />)
    const signOutButtons = screen.queryAllByRole('button', { name: /sign out/i })
    expect(signOutButtons).toHaveLength(0)
  })

  it('opening a window from an icon renders the window', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DesktopPage />)

    const ieIcon = screen.getByRole('button', { name: 'Internet Explorer' })
    await act(async () => {
      await user.dblClick(ieIcon)
    })

    expect(screen.getByTestId('managed-window-win-1')).toBeInTheDocument()
    // The taskbar compacts open windows into one app button per kind, so the
    // opened IE window surfaces a taskbar entry for the Internet Explorer app.
    const taskbar = screen.getByRole('navigation', { name: /taskbar/i })
    expect(
      within(taskbar).getAllByRole('button', { name: 'Internet Explorer' }).length
    ).toBeGreaterThan(0)
  })

  it('opening an IE window with title "Getting Started" starts on that route', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DesktopPage />)

    const gettingStartedIcon = screen.getByRole('button', { name: 'Getting Started' })
    await act(async () => {
      await user.dblClick(gettingStartedIcon)
    })

    expect(screen.getByRole('combobox', { name: /address/i })).toHaveValue(
      'https://www.example.com/getting-started'
    )
  })
})

function makeWindowState(overrides: Partial<RootState['window']> = {}): {
  window: RootState['window']
} {
  return {
    window: {
      byId: {},
      ids: [],
      zCounter: 0,
      nextIdSeed: 0,
      ...overrides,
    },
  }
}

describe('WindowManager', () => {
  it('renders nothing when no windows are open', () => {
    const { container } = renderWithProviders(<WindowManager />, {
      preloadedState: makeWindowState(),
    })
    expect(container.querySelector('[data-testid^="managed-window"]')).toBeNull()
  })

  it('renders a WindowWrapper for each visible window', () => {
    renderWithProviders(<WindowManager />, {
      preloadedState: makeWindowState({
        byId: {
          'win-1': {
            id: 'win-1',
            kind: 'internet-explorer',
            title: 'Home',
            position: { x: 100, y: 50 },
            size: { width: 400, height: 300 },
            zIndex: 1,
            isMinimized: false,
            isMaximized: false,
            prevGeometry: null,
          },
          'win-2': {
            id: 'win-2',
            kind: 'internet-explorer',
            title: 'Getting Started',
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
      }),
    })

    expect(screen.getByTestId('managed-window-win-1')).toBeInTheDocument()
    expect(screen.getByTestId('managed-window-win-2')).toBeInTheDocument()
  })

  it('does not render minimized windows', () => {
    renderWithProviders(<WindowManager />, {
      preloadedState: makeWindowState({
        byId: {
          'win-1': {
            id: 'win-1',
            kind: 'internet-explorer',
            title: 'Home',
            position: { x: 100, y: 50 },
            size: { width: 400, height: 300 },
            zIndex: 1,
            isMinimized: true,
            isMaximized: false,
            prevGeometry: null,
          },
          'win-2': {
            id: 'win-2',
            kind: 'internet-explorer',
            title: 'Getting Started',
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
      }),
    })

    expect(screen.queryByTestId('managed-window-win-1')).not.toBeInTheDocument()
    expect(screen.getByTestId('managed-window-win-2')).toBeInTheDocument()
  })

  it('renders InternetExplorerWindow for internet-explorer kind', () => {
    renderWithProviders(<WindowManager />, {
      preloadedState: makeWindowState({
        byId: {
          'win-1': {
            id: 'win-1',
            kind: 'internet-explorer',
            title: 'Getting Started',
            position: { x: 100, y: 50 },
            size: { width: 800, height: 600 },
            zIndex: 1,
            isMinimized: false,
            isMaximized: false,
            prevGeometry: null,
          },
        },
        ids: ['win-1'],
        zCounter: 1,
        nextIdSeed: 1,
      }),
    })

    expect(screen.getByTestId('managed-window-win-1')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /address/i })).toHaveValue(
      'https://www.example.com/getting-started'
    )
  })
})
