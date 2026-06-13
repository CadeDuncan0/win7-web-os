import { DEFAULT_ROUTE, IE_ROUTES, resolveRoute, titleToRoute } from './ieRoutes'
import { InternetExplorerWindow } from './InternetExplorerWindow'
import { useIENavigation } from './useIENavigation'
import { act, renderHook, renderWithProviders, screen, within } from '@/test-utils'

// ---------------------------------------------------------------------------
// Route registry
// ---------------------------------------------------------------------------

describe('ieRoutes', () => {
  it('resolveRoute returns the route for a known URL', () => {
    const route = resolveRoute('about:home')
    expect(route).toBeDefined()
    expect(route!.title).toBe('Internet Explorer')
  })

  it('resolveRoute returns undefined for unknown URLs', () => {
    expect(resolveRoute('https://unknown.example.com')).toBeUndefined()
  })

  it('titleToRoute maps known titles to URLs', () => {
    expect(titleToRoute('Resume')).toBe('portfolio://resume')
    expect(titleToRoute('Projects')).toBe('portfolio://projects')
    expect(titleToRoute('GitHub')).toBe('https://github.com/CadeDuncan')
  })

  it('titleToRoute returns DEFAULT_ROUTE for unknown titles', () => {
    expect(titleToRoute('Nonexistent')).toBe(DEFAULT_ROUTE)
  })
})

// ---------------------------------------------------------------------------
// useIENavigation hook
// ---------------------------------------------------------------------------

describe('useIENavigation', () => {
  it('initializes with the given route', () => {
    const { result } = renderHook(() => useIENavigation('about:home'))
    expect(result.current.currentUrl).toBe('about:home')
    expect(result.current.canGoBack).toBe(false)
    expect(result.current.canGoForward).toBe(false)
  })

  it('navigate pushes a new entry and truncates forward history', () => {
    const { result } = renderHook(() => useIENavigation('about:home'))

    act(() => result.current.navigate('portfolio://resume'))
    expect(result.current.currentUrl).toBe('portfolio://resume')
    expect(result.current.canGoBack).toBe(true)

    act(() => result.current.goBack())
    expect(result.current.currentUrl).toBe('about:home')

    act(() => result.current.navigate('portfolio://projects'))
    expect(result.current.currentUrl).toBe('portfolio://projects')
    expect(result.current.canGoForward).toBe(false)
  })

  it('goBack decrements index without modifying stack', () => {
    const { result } = renderHook(() => useIENavigation('about:home'))

    act(() => result.current.navigate('portfolio://resume'))
    act(() => result.current.goBack())
    expect(result.current.currentUrl).toBe('about:home')
    expect(result.current.canGoForward).toBe(true)
  })

  it('goForward increments index without modifying stack', () => {
    const { result } = renderHook(() => useIENavigation('about:home'))

    act(() => result.current.navigate('portfolio://resume'))
    act(() => result.current.goBack())
    act(() => result.current.goForward())
    expect(result.current.currentUrl).toBe('portfolio://resume')
  })

  it('goBack is no-op at index 0', () => {
    const { result } = renderHook(() => useIENavigation('about:home'))
    act(() => result.current.goBack())
    expect(result.current.currentUrl).toBe('about:home')
  })

  it('goForward is no-op at end of stack', () => {
    const { result } = renderHook(() => useIENavigation('about:home'))
    act(() => result.current.goForward())
    expect(result.current.currentUrl).toBe('about:home')
  })
})

// ---------------------------------------------------------------------------
// InternetExplorerWindow
// ---------------------------------------------------------------------------

describe('InternetExplorerWindow', () => {
  it('renders the toolbar with navigation buttons', () => {
    renderWithProviders(<InternetExplorerWindow />)
    expect(screen.getByRole('toolbar', { name: /navigation/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /forward/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument()
  })

  it('renders the favorites bar with bookmark links', () => {
    renderWithProviders(<InternetExplorerWindow />)
    const favBar = screen.getByRole('toolbar', { name: /favorites/i })
    expect(favBar).toBeInTheDocument()

    const nonHomeRoutes = Object.values(IE_ROUTES).filter((r) => r.url !== DEFAULT_ROUTE)
    const favScope = within(favBar)
    for (const route of nonHomeRoutes) {
      expect(favScope.getByRole('button', { name: route.title })).toBeInTheDocument()
    }
  })

  it('renders the IE favicon in the address bar', () => {
    const { container } = renderWithProviders(<InternetExplorerWindow />)
    const favicon = container.querySelector('img[src*="internetexplorer_logo"]')
    expect(favicon).toBeInTheDocument()
  })

  it('starts on about:home by default', () => {
    renderWithProviders(<InternetExplorerWindow />)
    expect(screen.getByText('about:home')).toBeInTheDocument()
  })

  it('starts on the specified initialRoute', () => {
    renderWithProviders(<InternetExplorerWindow initialRoute="portfolio://resume" />)
    expect(screen.getByText('portfolio://resume')).toBeInTheDocument()
  })

  it('back button is disabled on initial page', () => {
    renderWithProviders(<InternetExplorerWindow />)
    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled()
  })

  it('forward button is disabled when no forward history', () => {
    renderWithProviders(<InternetExplorerWindow />)
    expect(screen.getByRole('button', { name: /forward/i })).toBeDisabled()
  })
})

// ---------------------------------------------------------------------------
// Navigation behavior
// ---------------------------------------------------------------------------

describe('InternetExplorerWindow — navigation', () => {
  it('clicking a favorites bar bookmark navigates to that route', () => {
    renderWithProviders(<InternetExplorerWindow />)
    const favBar = screen.getByRole('toolbar', { name: /favorites/i })
    const resumeBtn = within(favBar).getByRole('button', { name: 'Resume' })

    act(() => {
      resumeBtn.click()
    })

    expect(screen.getByText('portfolio://resume')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back/i })).not.toBeDisabled()
  })

  it('back button returns to previous page', () => {
    renderWithProviders(<InternetExplorerWindow />)
    const favBar = screen.getByRole('toolbar', { name: /favorites/i })

    act(() => {
      within(favBar).getByRole('button', { name: 'Resume' }).click()
    })
    expect(screen.getByText('portfolio://resume')).toBeInTheDocument()

    act(() => {
      screen.getByRole('button', { name: /back/i }).click()
    })
    expect(screen.getByText('about:home')).toBeInTheDocument()
  })

  it('forward button works after going back', () => {
    renderWithProviders(<InternetExplorerWindow />)
    const favBar = screen.getByRole('toolbar', { name: /favorites/i })

    act(() => {
      within(favBar).getByRole('button', { name: 'Resume' }).click()
    })
    act(() => {
      screen.getByRole('button', { name: /back/i }).click()
    })

    const fwdBtn = screen.getByRole('button', { name: /forward/i })
    expect(fwdBtn).not.toBeDisabled()

    act(() => {
      fwdBtn.click()
    })
    expect(screen.getByText('portfolio://resume')).toBeInTheDocument()
  })

  it('refresh/home button navigates to about:home', () => {
    renderWithProviders(<InternetExplorerWindow initialRoute="portfolio://resume" />)
    expect(screen.getByText('portfolio://resume')).toBeInTheDocument()

    act(() => {
      screen.getByRole('button', { name: /home/i }).click()
    })
    expect(screen.getByText('about:home')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Page rendering
// ---------------------------------------------------------------------------

describe('InternetExplorerWindow — page rendering', () => {
  it('renders HomePage for about:home', () => {
    renderWithProviders(<InternetExplorerWindow />)
    expect(screen.getByText('Welcome to Internet Explorer')).toBeInTheDocument()
  })

  it('renders ResumePage for portfolio://resume', () => {
    renderWithProviders(<InternetExplorerWindow initialRoute="portfolio://resume" />)
    expect(screen.getByRole('heading', { name: 'Resume' })).toBeInTheDocument()
    expect(screen.getByText('PDF viewer coming in Phase 3')).toBeInTheDocument()
  })

  it('renders ProjectsPage for portfolio://projects', () => {
    renderWithProviders(<InternetExplorerWindow initialRoute="portfolio://projects" />)
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument()
    expect(screen.getByText('Portfolio Website')).toBeInTheDocument()
  })

  it('renders ExternalLinkPage for external routes', () => {
    renderWithProviders(<InternetExplorerWindow initialRoute="https://github.com/CadeDuncan" />)
    expect(screen.getByRole('button', { name: /open in new tab/i })).toBeInTheDocument()
  })

  it('ExternalLinkPage calls window.open with noopener', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    renderWithProviders(<InternetExplorerWindow initialRoute="https://github.com/CadeDuncan" />)

    act(() => {
      screen.getByRole('button', { name: /open in new tab/i }).click()
    })

    expect(openSpy).toHaveBeenCalledWith('https://github.com/CadeDuncan', '_blank', 'noopener')
    openSpy.mockRestore()
  })
})
