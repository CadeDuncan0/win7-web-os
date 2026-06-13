import { useCallback, useReducer } from 'react'

type NavAction = { type: 'navigate'; url: string } | { type: 'back' } | { type: 'forward' }

interface NavState {
  stack: string[]
  index: number
}

function navReducer(state: NavState, action: NavAction): NavState {
  switch (action.type) {
    case 'navigate':
      return {
        stack: [...state.stack.slice(0, state.index + 1), action.url],
        index: state.index + 1,
      }
    case 'back':
      return state.index > 0 ? { ...state, index: state.index - 1 } : state
    case 'forward':
      return state.index < state.stack.length - 1 ? { ...state, index: state.index + 1 } : state
  }
}

export interface UseIENavigationReturn {
  currentUrl: string
  canGoBack: boolean
  canGoForward: boolean
  navigate: (url: string) => void
  goBack: () => void
  goForward: () => void
}

export function useIENavigation(initialRoute: string): UseIENavigationReturn {
  const [state, dispatch] = useReducer(navReducer, {
    stack: [initialRoute],
    index: 0,
  })

  const navigate = useCallback((url: string) => dispatch({ type: 'navigate', url }), [])
  const goBack = useCallback(() => dispatch({ type: 'back' }), [])
  const goForward = useCallback(() => dispatch({ type: 'forward' }), [])

  return {
    currentUrl: state.stack[state.index],
    canGoBack: state.index > 0,
    canGoForward: state.index < state.stack.length - 1,
    navigate,
    goBack,
    goForward,
  }
}
