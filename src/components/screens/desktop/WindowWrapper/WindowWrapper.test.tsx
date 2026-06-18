// Tests verify Redux wiring: state reading, inline style application,
// active/inactive derivation, title-bar control dispatches, and focus promotion.

import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { WindowWrapper } from './WindowWrapper'
import type { RootState } from '@/store'
import { renderWithProviders } from '@/test-utils/renderWithProviders'

const SINGLE_WINDOW: Partial<RootState> = {
  window: {
    byId: {
      'win-1': {
        id: 'win-1',
        kind: 'internet-explorer',
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
        kind: 'internet-explorer',
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
        kind: 'internet-explorer',
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

const THREE_WINDOWS: Partial<RootState> = {
  window: {
    byId: {
      'win-1': {
        id: 'win-1',
        kind: 'internet-explorer',
        title: 'Window A',
        position: { x: 50, y: 30 },
        size: { width: 400, height: 300 },
        zIndex: 1,
        isMinimized: false,
        isMaximized: false,
        prevGeometry: null,
      },
      'win-2': {
        id: 'win-2',
        kind: 'internet-explorer',
        title: 'Window B',
        position: { x: 150, y: 80 },
        size: { width: 400, height: 300 },
        zIndex: 2,
        isMinimized: false,
        isMaximized: false,
        prevGeometry: null,
      },
      'win-3': {
        id: 'win-3',
        kind: 'internet-explorer',
        title: 'Window C',
        position: { x: 250, y: 130 },
        size: { width: 400, height: 300 },
        zIndex: 3,
        isMinimized: false,
        isMaximized: false,
        prevGeometry: null,
      },
    },
    ids: ['win-1', 'win-2', 'win-3'],
    zCounter: 3,
    nextIdSeed: 3,
  },
}

const MAXIMIZED_WINDOW: Partial<RootState> = {
  window: {
    byId: {
      'win-1': {
        id: 'win-1',
        kind: 'internet-explorer',
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

describe('WindowWrapper', () => {
  it('renders the window title from Redux state', () => {
    renderWithProviders(<WindowWrapper windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    expect(screen.getByText('Test Window')).toBeInTheDocument()
  })

  it('renders nothing when windowId does not exist in state', () => {
    const { container } = renderWithProviders(<WindowWrapper windowId="win-999" />, {
      preloadedState: SINGLE_WINDOW,
    })

    expect(container.innerHTML).toBe('')
  })

  it('applies position and size from Redux as inline styles', () => {
    renderWithProviders(<WindowWrapper windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    const wrapper = screen.getByTestId('managed-window-win-1')
    expect(wrapper.style.left).toBe('100px')
    expect(wrapper.style.top).toBe('50px')
    expect(wrapper.style.width).toBe('400px')
    expect(wrapper.style.height).toBe('300px')
  })

  it('applies zIndex from Redux state', () => {
    renderWithProviders(<WindowWrapper windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    const wrapper = screen.getByTestId('managed-window-win-1')
    expect(wrapper.style.zIndex).toBe('1')
  })

  it('passes active=true when window is the top window', () => {
    const { container } = renderWithProviders(<WindowWrapper windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    expect(container.querySelector('.window.active')).not.toBeNull()
  })

  it('passes active=false when another window is on top', () => {
    const { container } = renderWithProviders(<WindowWrapper windowId="win-1" />, {
      preloadedState: TWO_WINDOWS,
    })

    // win-1 has zIndex 1, win-2 has zIndex 2 — win-1 should NOT be active
    const windowEl = container.querySelector('.window')
    expect(windowEl).not.toBeNull()
    expect(windowEl!.classList.contains('active')).toBe(false)
  })

  it('dispatches closeWindow when Close button is clicked', async () => {
    const user = userEvent.setup()
    const { store } = renderWithProviders(<WindowWrapper windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(store.getState().window.byId['win-1']).toBeUndefined()
    expect(store.getState().window.ids).not.toContain('win-1')
  })

  it('dispatches minimizeWindow when Minimize button is clicked', async () => {
    const user = userEvent.setup()
    const { store } = renderWithProviders(<WindowWrapper windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    await user.click(screen.getByRole('button', { name: 'Minimize' }))

    expect(store.getState().window.byId['win-1'].isMinimized).toBe(true)
  })

  it('dispatches toggleMaximize when Maximize button is clicked', async () => {
    const user = userEvent.setup()
    const { store } = renderWithProviders(<WindowWrapper windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    await user.click(screen.getByRole('button', { name: 'Maximize' }))

    expect(store.getState().window.byId['win-1'].isMaximized).toBe(true)
  })

  it('shows Restore button when window is maximized', () => {
    renderWithProviders(<WindowWrapper windowId="win-1" />, {
      preloadedState: MAXIMIZED_WINDOW,
    })

    expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Maximize' })).not.toBeInTheDocument()
  })

  it('dispatches focusWindow on pointerdown', () => {
    const { store } = renderWithProviders(<WindowWrapper windowId="win-1" />, {
      preloadedState: TWO_WINDOWS,
    })

    const wrapper = screen.getByTestId('managed-window-win-1')
    fireEvent.pointerDown(wrapper)

    // win-1 was at zIndex 1, zCounter was 2 — after focus, zCounter bumps to 3
    expect(store.getState().window.byId['win-1'].zIndex).toBe(3)
  })
})

// ─── Dragging ──────────────────────────────────────────────────────────────

function pointerDrag(
  titleBar: Element,
  wrapper: HTMLElement,
  from: { clientX: number; clientY: number },
  to: { clientX: number; clientY: number }
) {
  fireEvent.pointerDown(titleBar, { ...from, pointerId: 1 })
  fireEvent.pointerMove(wrapper, { ...to, pointerId: 1 })
  fireEvent.pointerUp(wrapper, { ...to, pointerId: 1 })
}

describe('WindowWrapper — dragging', () => {
  // jsdom viewport: 1024×768, TASKBAR_RESERVE = 40 → clamp viewport 1024×728

  it('commits the moved position to Redux on pointerup', () => {
    const { store, container } = renderWithProviders(<WindowWrapper windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    const wrapper = screen.getByTestId('managed-window-win-1')
    const titleBar = container.querySelector('.title-bar')!

    pointerDrag(titleBar, wrapper, { clientX: 150, clientY: 60 }, { clientX: 250, clientY: 160 })

    const pos = store.getState().window.byId['win-1'].position
    expect(pos).toEqual({ x: 200, y: 150 })
  })

  it('does not write to Redux during pointermove (transient phase)', () => {
    const { store, container } = renderWithProviders(<WindowWrapper windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    const wrapper = screen.getByTestId('managed-window-win-1')
    const titleBar = container.querySelector('.title-bar')!

    fireEvent.pointerDown(titleBar, { clientX: 150, clientY: 60, pointerId: 1 })
    fireEvent.pointerMove(wrapper, { clientX: 250, clientY: 160, pointerId: 1 })

    expect(store.getState().window.byId['win-1'].position).toEqual({ x: 100, y: 50 })
  })

  it('clamps the committed position to the viewport', () => {
    const { store, container } = renderWithProviders(<WindowWrapper windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    const wrapper = screen.getByTestId('managed-window-win-1')
    const titleBar = container.querySelector('.title-bar')!

    pointerDrag(titleBar, wrapper, { clientX: 150, clientY: 60 }, { clientX: 5000, clientY: 5000 })

    const pos = store.getState().window.byId['win-1'].position
    // maxX = 1024 - 400 = 624, maxY = 728 - 300 = 428
    expect(pos).toEqual({ x: 624, y: 428 })
  })

  it('clamps to 0 when dragged past the top-left', () => {
    const { store, container } = renderWithProviders(<WindowWrapper windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    const wrapper = screen.getByTestId('managed-window-win-1')
    const titleBar = container.querySelector('.title-bar')!

    pointerDrag(
      titleBar,
      wrapper,
      { clientX: 150, clientY: 60 },
      { clientX: -5000, clientY: -5000 }
    )

    expect(store.getState().window.byId['win-1'].position).toEqual({ x: 0, y: 0 })
  })

  it('does not drag when pointerdown starts on a control button', () => {
    const { store } = renderWithProviders(<WindowWrapper windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    const wrapper = screen.getByTestId('managed-window-win-1')
    const closeBtn = screen.getByRole('button', { name: 'Close' })

    fireEvent.pointerDown(closeBtn, { clientX: 150, clientY: 60, pointerId: 1 })
    fireEvent.pointerMove(wrapper, { clientX: 300, clientY: 200, pointerId: 1 })
    fireEvent.pointerUp(wrapper, { clientX: 300, clientY: 200, pointerId: 1 })

    expect(store.getState().window.byId['win-1']?.position).toEqual({ x: 100, y: 50 })
  })

  it('does not drag a maximized window', () => {
    const { store, container } = renderWithProviders(<WindowWrapper windowId="win-1" />, {
      preloadedState: MAXIMIZED_WINDOW,
    })

    const wrapper = screen.getByTestId('managed-window-win-1')
    const titleBar = container.querySelector('.title-bar')!

    pointerDrag(titleBar, wrapper, { clientX: 100, clientY: 20 }, { clientX: 300, clientY: 200 })

    expect(store.getState().window.byId['win-1'].position).toEqual({ x: 0, y: 0 })
  })

  it('still promotes z-index on title-bar pointerdown', () => {
    const { store } = renderWithProviders(
      <>
        <WindowWrapper windowId="win-1" />
        <WindowWrapper windowId="win-2" />
      </>,
      { preloadedState: TWO_WINDOWS }
    )

    const wrapper = screen.getByTestId('managed-window-win-1')
    fireEvent.pointerDown(wrapper, { clientX: 100, clientY: 50, pointerId: 1 })

    expect(store.getState().window.byId['win-1'].zIndex).toBe(3)
  })
})

// ─── Maximize / Restore / Minimize Geometry ───────────────────────────────

describe('WindowWrapper — maximize / restore / minimize geometry', () => {
  // jsdom viewport: 1024×768

  it('toggles maximize on title-bar double-click', () => {
    const { store, container } = renderWithProviders(<WindowWrapper windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    const titleBar = container.querySelector('.title-bar')!
    fireEvent.doubleClick(titleBar)

    const win = store.getState().window.byId['win-1']
    expect(win.isMaximized).toBe(true)
    expect(win.position).toEqual({ x: 0, y: 0 })
    expect(win.size.width).toBe(1024)
    expect(win.prevGeometry).toEqual({ x: 100, y: 50, width: 400, height: 300 })
  })

  it('restores original geometry on second title-bar double-click', () => {
    const { store, container } = renderWithProviders(<WindowWrapper windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    const titleBar = container.querySelector('.title-bar')!
    fireEvent.doubleClick(titleBar)
    fireEvent.doubleClick(titleBar)

    const win = store.getState().window.byId['win-1']
    expect(win.isMaximized).toBe(false)
    expect(win.position).toEqual({ x: 100, y: 50 })
    expect(win.size).toEqual({ width: 400, height: 300 })
    expect(win.prevGeometry).toBeNull()
  })

  it('does not toggle maximize when double-clicking a control button', () => {
    const { store } = renderWithProviders(<WindowWrapper windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    const minimizeBtn = screen.getByRole('button', { name: 'Minimize' })
    fireEvent.doubleClick(minimizeBtn)

    expect(store.getState().window.byId['win-1'].isMaximized).toBe(false)
  })

  it('does not toggle maximize when double-clicking the window body', () => {
    const { store } = renderWithProviders(
      <WindowWrapper windowId="win-1">
        <p>Body content</p>
      </WindowWrapper>,
      { preloadedState: SINGLE_WINDOW }
    )

    fireEvent.doubleClick(screen.getByText('Body content'))

    expect(store.getState().window.byId['win-1'].isMaximized).toBe(false)
  })

  it('applies the maximized CSS class when isMaximized is true', () => {
    renderWithProviders(<WindowWrapper windowId="win-1" />, {
      preloadedState: MAXIMIZED_WINDOW,
    })

    const wrapper = screen.getByTestId('managed-window-win-1')
    expect(wrapper.className).toMatch(/maximized/)
  })

  it('does not have the maximized class when isMaximized is false', () => {
    renderWithProviders(<WindowWrapper windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    const wrapper = screen.getByTestId('managed-window-win-1')
    expect(wrapper.className).not.toMatch(/maximized/)
  })

  it('dispatches minimizeWindow and the window remains in Redux', async () => {
    const user = userEvent.setup()
    const { store } = renderWithProviders(<WindowWrapper windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    await user.click(screen.getByRole('button', { name: 'Minimize' }))

    const win = store.getState().window.byId['win-1']
    expect(win.isMinimized).toBe(true)
    expect(win.id).toBe('win-1')
    expect(store.getState().window.ids).toContain('win-1')
  })
})

// ─── Z-Index Stacking + Focus Promotion ───────────────────────────────────

describe('WindowWrapper — z-index stacking + focus promotion', () => {
  it('clicking a background window promotes it to the top z-index', () => {
    const { store } = renderWithProviders(
      <>
        <WindowWrapper windowId="win-1" />
        <WindowWrapper windowId="win-2" />
      </>,
      { preloadedState: TWO_WINDOWS }
    )

    const wrapper1 = screen.getByTestId('managed-window-win-1')
    fireEvent.pointerDown(wrapper1)

    const z1 = store.getState().window.byId['win-1'].zIndex
    const z2 = store.getState().window.byId['win-2'].zIndex
    expect(z1).toBeGreaterThan(z2)
  })

  it('switches active chrome from the old top window to the newly focused one', () => {
    renderWithProviders(
      <>
        <WindowWrapper windowId="win-1" />
        <WindowWrapper windowId="win-2" />
      </>,
      { preloadedState: TWO_WINDOWS }
    )

    const wrapper1 = screen.getByTestId('managed-window-win-1')
    const wrapper2 = screen.getByTestId('managed-window-win-2')

    const win1Window = wrapper1.querySelector('.window')!
    const win2Window = wrapper2.querySelector('.window')!
    expect(win2Window.classList.contains('active')).toBe(true)
    expect(win1Window.classList.contains('active')).toBe(false)

    fireEvent.pointerDown(wrapper1)

    expect(win1Window.classList.contains('active')).toBe(true)
    expect(win2Window.classList.contains('active')).toBe(false)
  })

  it('body-click promotes focus (event bubbles from child to wrapper)', () => {
    const { store } = renderWithProviders(
      <>
        <WindowWrapper windowId="win-1">
          <p>Click me</p>
        </WindowWrapper>
        <WindowWrapper windowId="win-2" />
      </>,
      { preloadedState: TWO_WINDOWS }
    )

    fireEvent.pointerDown(screen.getByText('Click me'))

    const z1 = store.getState().window.byId['win-1'].zIndex
    const z2 = store.getState().window.byId['win-2'].zIndex
    expect(z1).toBeGreaterThan(z2)
  })

  it('clicking the already-active window does not bump zCounter', () => {
    const { store } = renderWithProviders(<WindowWrapper windowId="win-1" />, {
      preloadedState: SINGLE_WINDOW,
    })

    const zBefore = store.getState().window.zCounter
    const wrapper = screen.getByTestId('managed-window-win-1')
    fireEvent.pointerDown(wrapper)

    expect(store.getState().window.zCounter).toBe(zBefore)
  })

  it('three windows: clicking the bottom window promotes it above both others', () => {
    const { store } = renderWithProviders(
      <>
        <WindowWrapper windowId="win-1" />
        <WindowWrapper windowId="win-2" />
        <WindowWrapper windowId="win-3" />
      </>,
      { preloadedState: THREE_WINDOWS }
    )

    fireEvent.pointerDown(screen.getByTestId('managed-window-win-1'))

    const z1 = store.getState().window.byId['win-1'].zIndex
    const z2 = store.getState().window.byId['win-2'].zIndex
    const z3 = store.getState().window.byId['win-3'].zIndex
    expect(z1).toBeGreaterThan(z3)
    expect(z3).toBeGreaterThan(z2)

    const wrapper1 = screen.getByTestId('managed-window-win-1')
    expect(wrapper1.querySelector('.window.active')).not.toBeNull()
  })

  it('active window count is always exactly one after any focus change', () => {
    const { container } = renderWithProviders(
      <>
        <WindowWrapper windowId="win-1" />
        <WindowWrapper windowId="win-2" />
        <WindowWrapper windowId="win-3" />
      </>,
      { preloadedState: THREE_WINDOWS }
    )

    fireEvent.pointerDown(screen.getByTestId('managed-window-win-1'))
    expect(container.querySelectorAll('.window.active')).toHaveLength(1)

    fireEvent.pointerDown(screen.getByTestId('managed-window-win-2'))
    expect(container.querySelectorAll('.window.active')).toHaveLength(1)
  })
})
