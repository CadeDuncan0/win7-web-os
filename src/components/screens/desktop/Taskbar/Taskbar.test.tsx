import { act } from 'react'

import { Taskbar } from './Taskbar'
import { type RootState } from '@/store'
import type { WindowState } from '@/store/slices/windowSlice'
import { fireEvent, renderWithProviders, screen, waitFor, within } from '@/test-utils'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/lib/auth', () => ({
  signOut: vi.fn().mockResolvedValue({ ok: true, data: null }),
}))

// ─── Fixtures ──────────────────────────────────────────────────────────────

const NO_WINDOWS: Partial<RootState> = {
  window: {
    byId: {},
    ids: [],
    zCounter: 0,
    nextIdSeed: 0,
  } satisfies WindowState,
}

// Two windows of the SAME app (kind) — they compact into one taskbar button.
// win-2 has the higher zIndex, so it is the active (top) window.
const TWO_IE_WINDOWS: Partial<RootState> = {
  window: {
    byId: {
      'win-1': {
        id: 'win-1',
        kind: 'internet-explorer',
        title: 'Home',
        position: { x: 80, y: 80 },
        size: { width: 640, height: 440 },
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
        size: { width: 640, height: 440 },
        zIndex: 2,
        isMinimized: false,
        isMaximized: false,
        prevGeometry: null,
      },
    },
    ids: ['win-1', 'win-2'],
    zCounter: 2,
    nextIdSeed: 2,
  } satisfies WindowState,
}

const SINGLE_WINDOW: Partial<RootState> = {
  window: {
    byId: {
      'win-1': {
        id: 'win-1',
        kind: 'internet-explorer',
        title: 'Home',
        position: { x: 80, y: 80 },
        size: { width: 640, height: 440 },
        zIndex: 1,
        isMinimized: false,
        isMaximized: false,
        prevGeometry: null,
      },
    },
    ids: ['win-1'],
    zCounter: 1,
    nextIdSeed: 1,
  } satisfies WindowState,
}

const MINIMIZED_WINDOW: Partial<RootState> = {
  window: {
    byId: {
      'win-1': {
        id: 'win-1',
        kind: 'internet-explorer',
        title: 'Home',
        position: { x: 80, y: 80 },
        size: { width: 640, height: 440 },
        zIndex: 1,
        isMinimized: true,
        isMaximized: false,
        prevGeometry: null,
      },
    },
    ids: ['win-1'],
    zCounter: 1,
    nextIdSeed: 1,
  } satisfies WindowState,
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('Taskbar', () => {
  it('renders the taskbar navigation landmark', () => {
    renderWithProviders(<Taskbar />, { preloadedState: NO_WINDOWS })

    expect(screen.getByRole('navigation', { name: /taskbar/i })).toBeInTheDocument()
  })

  it('renders the Start orb button', () => {
    renderWithProviders(<Taskbar />, { preloadedState: NO_WINDOWS })

    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
  })

  it('renders the system tray with time and date', () => {
    renderWithProviders(<Taskbar />, { preloadedState: NO_WINDOWS })

    const tray = screen.getByRole('status', { name: /system tray/i })
    const times = within(tray).getAllByText(/.+/)
    expect(times.length).toBeGreaterThanOrEqual(2)
  })

  it('compacts windows of the same app into one button that lists each window', () => {
    renderWithProviders(<Taskbar />, { preloadedState: TWO_IE_WINDOWS })

    // One app button for the Internet Explorer group...
    expect(screen.getByRole('button', { name: 'Internet Explorer' })).toBeInTheDocument()
    // ...whose popup lists every open window.
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Getting Started' })).toBeInTheDocument()
  })

  it('still shows a button for an app whose only window is minimized', () => {
    renderWithProviders(<Taskbar />, { preloadedState: MINIMIZED_WINDOW })

    expect(screen.getByRole('button', { name: 'Internet Explorer' })).toBeInTheDocument()
  })
})

describe('TaskbarIcon — app button click (single window)', () => {
  it('minimizes the active window', () => {
    const { store } = renderWithProviders(<Taskbar />, { preloadedState: SINGLE_WINDOW })

    fireEvent.click(screen.getByRole('button', { name: 'Internet Explorer' }))

    expect(store.getState().window.byId['win-1'].isMinimized).toBe(true)
  })

  it('restores a minimized window', () => {
    const { store } = renderWithProviders(<Taskbar />, { preloadedState: MINIMIZED_WINDOW })

    fireEvent.click(screen.getByRole('button', { name: 'Internet Explorer' }))

    expect(store.getState().window.byId['win-1'].isMinimized).toBe(false)
  })
})

describe('TaskbarIcon — window popup', () => {
  it('clicking an inactive window focuses it', () => {
    const { store } = renderWithProviders(<Taskbar />, { preloadedState: TWO_IE_WINDOWS })

    fireEvent.click(screen.getByRole('button', { name: 'Home' }))

    const state = store.getState().window
    expect(state.byId['win-1'].zIndex).toBeGreaterThan(state.byId['win-2'].zIndex)
  })

  it('clicking the active window minimizes it', () => {
    const { store } = renderWithProviders(<Taskbar />, { preloadedState: TWO_IE_WINDOWS })

    fireEvent.click(screen.getByRole('button', { name: 'Getting Started' }))

    expect(store.getState().window.byId['win-2'].isMinimized).toBe(true)
  })

  it('clicking a window close button closes that window', () => {
    const { store } = renderWithProviders(<Taskbar />, { preloadedState: TWO_IE_WINDOWS })

    fireEvent.click(screen.getByRole('button', { name: 'Close Home' }))

    expect(store.getState().window.byId['win-1']).toBeUndefined()
  })
})

describe('StartOrb — Start Menu toggle', () => {
  it('toggles the Start Menu on orb click', async () => {
    renderWithProviders(<Taskbar />, { preloadedState: NO_WINDOWS })

    const startButton = screen.getByRole('button', { name: /start/i })
    fireEvent.click(startButton)

    expect(screen.getByRole('menu', { name: /start menu/i })).toBeInTheDocument()

    fireEvent.click(startButton)

    await waitFor(() => {
      expect(screen.queryByRole('menu', { name: /start menu/i })).not.toBeInTheDocument()
    })
  })
})

describe('SystemTray — clock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('updates time on interval', () => {
    vi.setSystemTime(new Date(2026, 5, 12, 15, 44, 50))
    renderWithProviders(<Taskbar />, { preloadedState: NO_WINDOWS })

    const tray = screen.getByRole('status', { name: /system tray/i })
    expect(within(tray).getByText('3:44 PM')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(61_000)
    })

    expect(within(tray).getByText('3:45 PM')).toBeInTheDocument()
  })

  it('cleans up interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')

    const { unmount } = renderWithProviders(<Taskbar />, {
      preloadedState: NO_WINDOWS,
    })

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })
})
