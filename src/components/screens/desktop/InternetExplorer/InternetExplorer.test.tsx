import {
  DEFAULT_ROUTE,
  filterPages,
  IE_EXTERNAL_LINKS,
  IE_PAGES,
  inputToRoute,
  pageUrl,
  resolvePage,
  titleToRoute,
} from './ieRoutes'
import { InternetExplorerWindow } from './InternetExplorerWindow'
import { useIENavigation } from './useIENavigation'
import type { RootState } from '@/store'
import { act, fireEvent, renderHook, renderWithProviders, screen, within } from '@/test-utils'

// A single IE window seeded in the store so InternetExplorerWindow's WindowWrapper
// can read geometry/focus. `initialRoute` (not the title) drives the page shown.
function ieWindowState(title = 'Internet Explorer'): Partial<RootState> {
  return {
    window: {
      byId: {
        'ie-1': {
          id: 'ie-1',
          kind: 'internet-explorer',
          title,
          position: { x: 0, y: 0 },
          size: { width: 800, height: 500 },
          zIndex: 1,
          isMinimized: false,
          isMaximized: false,
          prevGeometry: null,
        },
      },
      ids: ['ie-1'],
      zCounter: 1,
      nextIdSeed: 1,
    },
  }
}

function renderIE(initialRoute?: string, title?: string) {
  return renderWithProviders(
    <InternetExplorerWindow windowId="ie-1" initialRoute={initialRoute} />,
    { preloadedState: ieWindowState(title) }
  )
}

const HOME_URL = 'https://www.cadeduncan.com/home'
const RESUME_URL = 'https://www.cadeduncan.com/portfolio/resume'
const PROJECTS_URL = 'https://www.cadeduncan.com/portfolio/projects'

// ---------------------------------------------------------------------------
// Route registry
// ---------------------------------------------------------------------------

describe('ieRoutes', () => {
  it('resolvePage returns the page for a known nickname', () => {
    expect(resolvePage('about:home')?.title).toBe('Home')
    expect(resolvePage('portfolio://resume')?.url).toBe(RESUME_URL)
  })

  it('resolvePage returns undefined for unknown nicknames', () => {
    expect(resolvePage('https://unknown.example.com')).toBeUndefined()
  })

  it('pageUrl maps a nickname to its full display URL', () => {
    expect(pageUrl('about:home')).toBe(HOME_URL)
    expect(pageUrl('portfolio://projects')).toBe(PROJECTS_URL)
  })

  it('titleToRoute maps page titles (and the app label) to nicknames', () => {
    expect(titleToRoute('Resume')).toBe('portfolio://resume')
    expect(titleToRoute('Projects')).toBe('portfolio://projects')
    expect(titleToRoute('Internet Explorer')).toBe(DEFAULT_ROUTE)
    expect(titleToRoute('Nonexistent')).toBe(DEFAULT_ROUTE)
  })

  it('filterPages lists all pages for an empty query and filters otherwise', () => {
    expect(filterPages('')).toHaveLength(IE_PAGES.length)
    expect(filterPages('proj').map((p) => p.title)).toEqual(['Projects'])
    expect(filterPages(PROJECTS_URL).map((p) => p.title)).toEqual(['Projects'])
    expect(filterPages('zzz')).toEqual([])
  })

  it('inputToRoute resolves nicknames, URLs, titles, and partial matches', () => {
    expect(inputToRoute('about:home')).toBe('about:home')
    expect(inputToRoute('Projects')).toBe('portfolio://projects')
    expect(inputToRoute(RESUME_URL)).toBe('portfolio://resume')
    expect(inputToRoute('proj')).toBe('portfolio://projects')
    expect(inputToRoute('')).toBeUndefined()
    expect(inputToRoute('zzz')).toBeUndefined()
  })

  it('external links are not navigable pages', () => {
    for (const link of IE_EXTERNAL_LINKS) {
      expect(resolvePage(link.url)).toBeUndefined()
    }
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
    act(() => result.current.navigate('portfolio://projects'))
    expect(result.current.currentUrl).toBe('portfolio://projects')
    expect(result.current.canGoForward).toBe(false)
  })

  it('back/forward move through the stack without modifying it', () => {
    const { result } = renderHook(() => useIENavigation('about:home'))

    act(() => result.current.navigate('portfolio://resume'))
    act(() => result.current.goBack())
    expect(result.current.currentUrl).toBe('about:home')
    expect(result.current.canGoForward).toBe(true)

    act(() => result.current.goForward())
    expect(result.current.currentUrl).toBe('portfolio://resume')
  })

  it('refresh reloads the current page without touching history', () => {
    const { result } = renderHook(() => useIENavigation('about:home'))

    act(() => result.current.navigate('portfolio://resume'))
    const keyBefore = result.current.reloadKey

    act(() => result.current.refresh())
    expect(result.current.currentUrl).toBe('portfolio://resume')
    expect(result.current.canGoBack).toBe(true)
    expect(result.current.canGoForward).toBe(false)
    expect(result.current.reloadKey).toBe(keyBefore + 1)
  })

  it('navigating to the current page reloads without adding history', () => {
    const { result } = renderHook(() => useIENavigation('about:home'))
    const keyBefore = result.current.reloadKey

    act(() => result.current.navigate('about:home'))
    expect(result.current.canGoBack).toBe(false)
    expect(result.current.reloadKey).toBe(keyBefore + 1)
  })
})

// ---------------------------------------------------------------------------
// InternetExplorerWindow — chrome
// ---------------------------------------------------------------------------

describe('InternetExplorerWindow — chrome', () => {
  it('renders the toolbar with nav, refresh, and clear controls', () => {
    renderIE()
    const toolbar = screen.getByRole('toolbar', { name: /navigation/i })
    const scope = within(toolbar)
    expect(scope.getByRole('button', { name: /back/i })).toBeInTheDocument()
    expect(scope.getByRole('button', { name: /forward/i })).toBeInTheDocument()
    expect(scope.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
    expect(scope.getByRole('button', { name: /clear/i })).toBeInTheDocument()
    expect(scope.getByRole('combobox', { name: /address/i })).toBeInTheDocument()
  })

  it('shows the app icon and title in the window title bar', () => {
    const { container } = renderIE(undefined, 'Internet Explorer')
    const titleBar = container.querySelector('.title-bar-text')!
    expect(titleBar).toHaveTextContent('Internet Explorer')
    expect(titleBar.querySelector('img[src*="internet-explorer-logo"]')).toBeInTheDocument()
  })

  it('back and forward are disabled on the initial page', () => {
    renderIE()
    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /forward/i })).toBeDisabled()
  })

  it('address bar shows the full URL of the current page', () => {
    renderIE()
    expect(screen.getByRole('combobox', { name: /address/i })).toHaveValue(HOME_URL)
  })

  it('opens on the specified initialRoute', () => {
    renderIE('portfolio://resume')
    expect(screen.getByRole('combobox', { name: /address/i })).toHaveValue(RESUME_URL)
    expect(screen.getByRole('heading', { name: 'Resume' })).toBeInTheDocument()
  })

  it('renders a blue underlined page link for every page', () => {
    renderIE()
    const links = screen.getByRole('navigation', { name: /pages/i })
    const scope = within(links)
    for (const page of IE_PAGES) {
      expect(scope.getByRole('button', { name: page.title })).toBeInTheDocument()
    }
    // External links are not in the chrome — they live in the page content.
    for (const link of IE_EXTERNAL_LINKS) {
      expect(scope.queryByRole('button', { name: link.title })).not.toBeInTheDocument()
    }
  })
})

// ---------------------------------------------------------------------------
// Navigation behavior
// ---------------------------------------------------------------------------

describe('InternetExplorerWindow — navigation', () => {
  function address() {
    return screen.getByRole('combobox', { name: /address/i })
  }

  function pageLinks() {
    return within(screen.getByRole('navigation', { name: /pages/i }))
  }

  it('clicking a page link navigates to that page', () => {
    renderIE()

    act(() => pageLinks().getByRole('button', { name: 'Resume' }).click())

    expect(address()).toHaveValue(RESUME_URL)
    expect(screen.getByRole('button', { name: /back/i })).not.toBeDisabled()
  })

  it('back returns to the previous page, forward replays it', () => {
    renderIE()

    act(() => pageLinks().getByRole('button', { name: 'Resume' }).click())
    act(() => screen.getByRole('button', { name: /back/i }).click())
    expect(address()).toHaveValue(HOME_URL)

    act(() => screen.getByRole('button', { name: /forward/i }).click())
    expect(address()).toHaveValue(RESUME_URL)
  })

  it('refresh reloads the current page and does not navigate home', () => {
    renderIE()

    act(() => pageLinks().getByRole('button', { name: 'Resume' }).click())
    act(() => screen.getByRole('button', { name: /refresh/i }).click())

    expect(address()).toHaveValue(RESUME_URL)
    expect(screen.getByRole('button', { name: /back/i })).not.toBeDisabled()
  })

  it('clicking an external link opens a new tab and does not navigate', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    renderIE()

    // External links live in the home page content, not the chrome.
    act(() => screen.getByRole('button', { name: 'GitHub' }).click())

    expect(openSpy).toHaveBeenCalledWith(IE_EXTERNAL_LINKS[0].url, '_blank', 'noopener')
    expect(address()).toHaveValue(HOME_URL)
    openSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// Address bar dropdown
// ---------------------------------------------------------------------------

describe('InternetExplorerWindow — address dropdown', () => {
  function address() {
    return screen.getByRole('combobox', { name: /address/i })
  }

  it('opens a dropdown of all pages when the address bar is clicked', () => {
    renderIE()
    act(() => fireEvent.click(address()))

    const listbox = screen.getByRole('listbox')
    expect(within(listbox).getAllByRole('option')).toHaveLength(IE_PAGES.length)
  })

  it('typing filters the dropdown results', () => {
    renderIE()
    act(() => fireEvent.click(address()))
    act(() => fireEvent.change(address(), { target: { value: 'proj' } }))

    const options = within(screen.getByRole('listbox')).getAllByRole('option')
    expect(options).toHaveLength(1)
    expect(options[0]).toHaveTextContent('Projects')
  })

  it('selecting a result navigates to that page', () => {
    renderIE()
    act(() => fireEvent.click(address()))
    const option = within(screen.getByRole('listbox')).getByRole('option', { name: /Projects/ })

    act(() => fireEvent.mouseDown(option))

    expect(address()).toHaveValue(PROJECTS_URL)
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument()
  })

  it('the clear button empties the input and reopens the dropdown', () => {
    renderIE()
    act(() => screen.getByRole('button', { name: /clear/i }).click())

    expect(address()).toHaveValue('')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Page rendering
// ---------------------------------------------------------------------------

describe('InternetExplorerWindow — page rendering', () => {
  it('renders HomePage for the home route', () => {
    renderIE('about:home')
    expect(screen.getByText('Welcome to Internet Explorer')).toBeInTheDocument()
  })

  it('renders ResumePage for the resume route', () => {
    renderIE('portfolio://resume')
    expect(screen.getByRole('heading', { name: 'Resume' })).toBeInTheDocument()
    expect(screen.getByText('PDF viewer coming in Phase 3')).toBeInTheDocument()
  })

  it('renders ProjectsPage for the projects route', () => {
    renderIE('portfolio://projects')
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument()
    expect(screen.getByText('Portfolio Website')).toBeInTheDocument()
  })
})
