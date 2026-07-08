import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { StartMenu } from './StartMenu'
import { renderWithProviders } from '@/test-utils/renderWithProviders'

// Stub next/navigation and auth module so tests can assert on
// route changes and sign-out calls without hitting real services.
// vi.hoisted lifts the mock fns above the hoisted vi.mock factories.
const { mockPush, mockSignOut } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockSignOut: vi.fn().mockResolvedValue({ ok: true, data: null }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/lib/auth', () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('StartMenu', () => {
  it('does not render when isOpen is false', () => {
    renderWithProviders(<StartMenu isOpen={false} onClose={vi.fn()} />)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('renders the menu panel when isOpen is true', () => {
    renderWithProviders(<StartMenu isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByRole('menu', { name: /start menu/i })).toBeInTheDocument()
  })

  it('renders all left-column shortcuts', () => {
    renderWithProviders(<StartMenu isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByRole('menuitem', { name: 'Internet Explorer' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Getting Started' })).toBeInTheDocument()
  })

  it('renders all right-column shortcuts', () => {
    renderWithProviders(<StartMenu isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByRole('menuitem', { name: 'GitHub' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'LinkedIn' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Source Code' })).toBeInTheDocument()
  })

  it('renders the Sign Out item', () => {
    renderWithProviders(<StartMenu isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByRole('menuitem', { name: 'Sign Out' })).toBeInTheDocument()
  })

  it('filters left-column shortcuts by search query', async () => {
    const user = userEvent.setup()
    renderWithProviders(<StartMenu isOpen={true} onClose={vi.fn()} />)

    const search = screen.getByRole('textbox', { name: /search/i })
    await user.type(search, 'gett')

    expect(screen.getByRole('menuitem', { name: 'Getting Started' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Internet Explorer' })).not.toBeInTheDocument()

    expect(screen.getByRole('menuitem', { name: 'GitHub' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'LinkedIn' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Source Code' })).toBeInTheDocument()
  })

  it('shows empty message when search matches nothing', async () => {
    const user = userEvent.setup()
    renderWithProviders(<StartMenu isOpen={true} onClose={vi.fn()} />)

    const search = screen.getByRole('textbox', { name: /search/i })
    await user.type(search, 'zzzznonexistent')

    expect(screen.queryByRole('menuitem', { name: 'Internet Explorer' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Getting Started' })).not.toBeInTheDocument()
    expect(screen.getByText('No matches')).toBeInTheDocument()
  })

  it('dispatches openWindow when a shortcut is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { store } = renderWithProviders(<StartMenu isOpen={true} onClose={onClose} />)

    const gettingStarted = screen.getByRole('menuitem', { name: 'Getting Started' })
    await user.click(gettingStarted)

    const state = store.getState().window
    expect(state.ids).toHaveLength(1)
    const windowId = state.ids[0]
    expect(state.byId[windowId].kind).toBe('internet-explorer')
    expect(state.byId[windowId].title).toBe('Getting Started')
  })

  it('opens an external link in a new tab (not an IE window) for a link shortcut', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { store } = renderWithProviders(<StartMenu isOpen={true} onClose={onClose} />)

    await user.click(screen.getByRole('menuitem', { name: 'GitHub' }))

    expect(openSpy).toHaveBeenCalledWith('https://github.com/your-username', '_blank', 'noopener')
    expect(store.getState().window.ids).toHaveLength(0) // no window opened
    expect(onClose).toHaveBeenCalledTimes(1)
    openSpy.mockRestore()
  })

  it('calls onClose when a shortcut is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<StartMenu isOpen={true} onClose={onClose} />)

    const gettingStarted = screen.getByRole('menuitem', { name: 'Getting Started' })
    await user.click(gettingStarted)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn()
    renderWithProviders(<StartMenu isOpen={true} onClose={onClose} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose on outside click', () => {
    const onClose = vi.fn()
    renderWithProviders(<StartMenu isOpen={true} onClose={onClose} />)

    fireEvent.mouseDown(document.body)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('focuses the search input when opened', async () => {
    renderWithProviders(<StartMenu isOpen={true} onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /search/i })).toHaveFocus()
    })
  })

  it('navigates menuitems with ArrowDown from search', async () => {
    const user = userEvent.setup()
    renderWithProviders(<StartMenu isOpen={true} onClose={vi.fn()} />)

    // Wait for the component's rAF auto-focus to settle before interacting
    const search = screen.getByRole('textbox', { name: /search/i })
    await waitFor(() => {
      expect(search).toHaveFocus()
    })

    await user.keyboard('{ArrowDown}')

    const firstItem = screen.getByRole('menuitem', { name: 'Internet Explorer' })
    expect(firstItem).toHaveFocus()
  })

  it('calls signOut, dispatches clearSession, and navigates on Sign Out click', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { store } = renderWithProviders(<StartMenu isOpen={true} onClose={onClose} />)

    const signOutItem = screen.getByRole('menuitem', { name: 'Sign Out' })
    await user.click(signOutItem)

    expect(onClose).toHaveBeenCalledTimes(1)

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })

    expect(store.getState().session.authStatus).toBe('unauthenticated')
    expect(mockPush).toHaveBeenCalledWith('/win7')
  })

  it('resets search query when menu closes via shortcut click', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { rerender } = renderWithProviders(<StartMenu isOpen={true} onClose={onClose} />)

    const search = screen.getByRole('textbox', { name: /search/i })
    await user.type(search, 'gett')

    expect(search).toHaveValue('gett')

    const gettingStarted = screen.getByRole('menuitem', { name: 'Getting Started' })
    await user.click(gettingStarted)

    rerender(<StartMenu isOpen={true} onClose={onClose} />)

    const searchAfter = screen.getByRole('textbox', { name: /search/i })
    expect(searchAfter).toHaveValue('')
  })
})
