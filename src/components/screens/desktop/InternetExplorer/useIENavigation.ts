import { useCallback, useReducer } from 'react'

type NavAction =
  { type: 'navigate'; url: string } | { type: 'back' } | { type: 'forward' } | { type: 'refresh' }

interface NavState {
  stack: string[]
  index: number
  /** Bumped on refresh so the page content can remount without a history entry. */
  reloadKey: number
}

function navReducer(state: NavState, action: NavAction): NavState {
  switch (action.type) {
    case 'navigate':
      // Navigating to the current page is a no-op for history (matches a browser
      // re-entering the same URL via the address bar — it just reloads).
      if (state.stack[state.index] === action.url) {
        return { ...state, reloadKey: state.reloadKey + 1 }
      }
      return {
        stack: [...state.stack.slice(0, state.index + 1), action.url],
        index: state.index + 1,
        reloadKey: state.reloadKey + 1,
      }
    case 'back':
      return state.index > 0 ? { ...state, index: state.index - 1 } : state
    case 'forward':
      return state.index < state.stack.length - 1 ? { ...state, index: state.index + 1 } : state
    case 'refresh':
      // Reload the current page only — never touches the history stack.
      return { ...state, reloadKey: state.reloadKey + 1 }
  }
}

export interface UseIENavigationReturn {
  currentUrl: string
  canGoBack: boolean
  canGoForward: boolean
  /** Changes whenever the page should remount (navigation or refresh). */
  reloadKey: number
  navigate: (url: string) => void
  goBack: () => void
  goForward: () => void
  refresh: () => void
}

export function useIENavigation(initialRoute: string): UseIENavigationReturn {
  const [state, dispatch] = useReducer(navReducer, {
    stack: [initialRoute],
    index: 0,
    reloadKey: 0,
  })

  const navigate = useCallback((url: string) => dispatch({ type: 'navigate', url }), [])
  const goBack = useCallback(() => dispatch({ type: 'back' }), [])
  const goForward = useCallback(() => dispatch({ type: 'forward' }), [])
  const refresh = useCallback(() => dispatch({ type: 'refresh' }), [])

  return {
    currentUrl: state.stack[state.index],
    canGoBack: state.index > 0,
    canGoForward: state.index < state.stack.length - 1,
    reloadKey: state.reloadKey,
    navigate,
    goBack,
    goForward,
    refresh,
  }
}
