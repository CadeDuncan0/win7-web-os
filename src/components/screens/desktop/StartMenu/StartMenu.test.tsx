import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { StartMenu } from './StartMenu'
import { renderWithProviders } from '@/test-utils/renderWithProviders'

// Stub next/navigation and auth module so tests can assert on
// route changes and sign-out calls without hitting real services.
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockSignOut = jest.fn().mockResolvedValue({ ok: true, data: null })
jest.mock('@/lib/auth', () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('StartMenu', () => {
  it('does not render when isOpen is false', () => {
    renderWithProviders(<StartMenu isOpen={false} onClose={jest.fn()} />)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('renders the menu panel when isOpen is true', () => {
    renderWithProviders(<StartMenu isOpen={true} onClose={jest.fn()} />)

    expect(screen.getByRole('menu', { name: /start menu/i })).toBeInTheDocument()
  })

  it('renders all left-column shortcuts', () => {
    renderWithProviders(<StartMenu isOpen={true} onClose={jest.fn()} />)

    expect(screen.getByRole('menuitem', { name: 'Resume' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Projects' })).toBeInTheDocument()
  })

  it('renders all right-column shortcuts', () => {
    renderWithProviders(<StartMenu isOpen={true} onClose={jest.fn()} />)

    expect(screen.getByRole('menuitem', { name: 'GitHub' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'LinkedIn' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Source Code' })).toBeInTheDocument()
  })

  it('renders the Sign Out item', () => {
    renderWithProviders(<StartMenu isOpen={true} onClose={jest.fn()} />)

    expect(screen.getByRole('menuitem', { name: 'Sign Out' })).toBeInTheDocument()
  })

  it('filters left-column shortcuts by search query', async () => {
    const user = userEvent.setup()
    renderWithProviders(<StartMenu isOpen={true} onClose={jest.fn()} />)

    const search = screen.getByRole('textbox', { name: /search/i })
    await user.type(search, 'res')

    expect(screen.getByRole('menuitem', { name: 'Resume' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Projects' })).not.toBeInTheDocument()

    expect(screen.getByRole('menuitem', { name: 'GitHub' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'LinkedIn' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Source Code' })).toBeInTheDocument()
  })

  it('shows empty message when search matches nothing', async () => {
    const user = userEvent.setup()
    renderWithProviders(<StartMenu isOpen={true} onClose={jest.fn()} />)

    const search = screen.getByRole('textbox', { name: /search/i })
    await user.type(search, 'zzzznonexistent')

    expect(screen.queryByRole('menuitem', { name: 'Resume' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Projects' })).not.toBeInTheDocument()
    expect(screen.getByText('No matches')).toBeInTheDocument()
  })

  it('dispatches openWindow when a shortcut is clicked', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    const { store } = renderWithProviders(<StartMenu isOpen={true} onClose={onClose} />)

    const resume = screen.getByRole('menuitem', { name: 'Resume' })
    await user.click(resume)

    const state = store.getState().window
    expect(state.ids).toHaveLength(1)
    const windowId = state.ids[0]
    expect(state.byId[windowId].kind).toBe('internet-explorer')
    expect(state.byId[windowId].title).toBe('Resume')
  })

  it('calls onClose when a shortcut is clicked', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    renderWithProviders(<StartMenu isOpen={true} onClose={onClose} />)

    const resume = screen.getByRole('menuitem', { name: 'Resume' })
    await user.click(resume)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose on Escape key', () => {
    const onClose = jest.fn()
    renderWithProviders(<StartMenu isOpen={true} onClose={onClose} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose on outside click', () => {
    const onClose = jest.fn()
    renderWithProviders(<StartMenu isOpen={true} onClose={onClose} />)

    fireEvent.mouseDown(document.body)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('focuses the search input when opened', async () => {
    renderWithProviders(<StartMenu isOpen={true} onClose={jest.fn()} />)

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /search/i })).toHaveFocus()
    })
  })

  it('navigates menuitems with ArrowDown from search', async () => {
    const user = userEvent.setup()
    renderWithProviders(<StartMenu isOpen={true} onClose={jest.fn()} />)

    // Wait for the component's rAF auto-focus to settle before interacting
    const search = screen.getByRole('textbox', { name: /search/i })
    await waitFor(() => {
      expect(search).toHaveFocus()
    })

    await user.keyboard('{ArrowDown}')

    const firstItem = screen.getByRole('menuitem', { name: 'Resume' })
    expect(firstItem).toHaveFocus()
  })

  it('calls signOut, dispatches clearSession, and navigates on Sign Out click', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    const { store } = renderWithProviders(<StartMenu isOpen={true} onClose={onClose} />)

    const signOutItem = screen.getByRole('menuitem', { name: 'Sign Out' })
    await user.click(signOutItem)

    expect(onClose).toHaveBeenCalledTimes(1)

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })

    expect(store.getState().session.authStatus).toBe('unauthenticated')
    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('resets search query when menu closes via shortcut click', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    const { rerender } = renderWithProviders(<StartMenu isOpen={true} onClose={onClose} />)

    const search = screen.getByRole('textbox', { name: /search/i })
    await user.type(search, 'res')

    expect(search).toHaveValue('res')

    const resume = screen.getByRole('menuitem', { name: 'Resume' })
    await user.click(resume)

    rerender(<StartMenu isOpen={true} onClose={onClose} />)

    const searchAfter = screen.getByRole('textbox', { name: /search/i })
    expect(searchAfter).toHaveValue('')
  })
})
