import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { registerIcon, selectDesktopIcons } from '@/store/slices/desktopSlice'
import { selectRole } from '@/store/slices/sessionSlice'
import { renderWithProviders, screen, userEvent } from '@/test-utils'

// A probe component that reads from the real store through the typed hooks and
// dispatches a real action — enough to prove the Provider, preloadedState, the
// returned store, and live dispatch all work through the helper.
function StoreProbe() {
  const role = useAppSelector(selectRole)
  const iconCount = useAppSelector(selectDesktopIcons).length
  const dispatch = useAppDispatch()

  return (
    <div>
      <p>role: {role ?? 'none'}</p>
      <p>icons: {iconCount}</p>
      <button
        type="button"
        onClick={() =>
          dispatch(
            registerIcon({
              id: 'icon-a',
              position: { column: 0, row: 0 },
              defaultPosition: { column: 0, row: 0 },
            })
          )
        }
      >
        add icon
      </button>
    </div>
  )
}

describe('renderWithProviders', () => {
  it('renders into jsdom and exposes jest-dom matchers', () => {
    renderWithProviders(<p>hello desktop</p>)
    expect(screen.getByText('hello desktop')).toBeInTheDocument()
  })

  it('seeds the Redux store from preloadedState', () => {
    renderWithProviders(<StoreProbe />, {
      preloadedState: {
        session: { role: 'admin', authStatus: 'authenticated', jwt: 'jwt', startedAt: 1000 },
      },
    })
    expect(screen.getByText('role: admin')).toBeInTheDocument()
  })

  it('returns the store and reflects real dispatches driven by user events', async () => {
    const { store } = renderWithProviders(<StoreProbe />)
    expect(screen.getByText('icons: 0')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'add icon' }))

    expect(screen.getByText('icons: 1')).toBeInTheDocument()
    expect(store.getState().desktop.iconIds).toEqual(['icon-a'])
  })

  it('isolates state between renders (fresh store per call)', async () => {
    const first = renderWithProviders(<StoreProbe />)
    await userEvent.click(screen.getByRole('button', { name: 'add icon' }))
    expect(first.store.getState().desktop.iconIds).toEqual(['icon-a'])

    first.unmount()

    // A second render must start from a clean store, not inherit the icon above.
    const second = renderWithProviders(<StoreProbe />)
    expect(second.store.getState().desktop.iconIds).toEqual([])
    expect(screen.getByText('icons: 0')).toBeInTheDocument()
  })
})
