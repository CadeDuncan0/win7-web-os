import { isWindowDisabled } from './disabledWindows'
import type { WindowKey } from './windowKeys'
import type { AppDispatch, RootState } from '@/store'
import { selectIsAdmin } from '@/store/slices/sessionSlice'
import { openWindow, type WindowKind } from '@/store/slices/windowSlice'

/**
 * The single gate for opening a window. Refuses windows turned off site-wide
 * (see disabledWindows) before dispatching openWindow, so no launcher — desktop
 * icon or Start Menu — can open a disabled window. Every launch path dispatches
 * this thunk instead of the raw openWindow action.
 */
export const openWindowIfEnabled =
  (params: {
    kind: WindowKind
    title: string
    windowKey: WindowKey
    size?: { width: number; height: number }
  }) =>
  (dispatch: AppDispatch, getState: () => RootState): void => {
    if (isWindowDisabled(params.windowKey, selectIsAdmin(getState()))) {
      return
    }
    dispatch(openWindow({ kind: params.kind, title: params.title, size: params.size }))
  }
