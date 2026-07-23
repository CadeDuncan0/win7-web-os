import { applicationByKey, isApplicationHidden } from '@/config/applications'
import { resolvePage } from '@/config/ieRoutes'
import type { AppDispatch, RootState } from '@/store'
import { selectIsAdmin } from '@/store/slices/sessionSlice'
import { openWindow } from '@/store/slices/windowSlice'

/**
 * The single gate for launching an application. Resolves the key against the
 * registry and refuses apps hidden from the current role (disabled site-wide
 * or role-hidden — see config/applications.ts) before acting, so no launcher —
 * desktop icon, Start Menu shortcut, or notification link — can launch a
 * retired app. Every launch path dispatches this thunk.
 *
 * Windowed applications (records with a `component` descriptor) open a window with
 * the descriptor's kind/component. Windowless applications are external
 * links: their `ieRoute` resolves against the enabled IE registry and the
 * redirect destination opens in a new browser tab — a disabled or non-redirect
 * route resolves to nothing, so it can never leak out.
 */
export const launchApplication =
  (key: string) =>
  (dispatch: AppDispatch, getState: () => RootState): void => {
    const app = applicationByKey(key)
    if (!app || isApplicationHidden(app, selectIsAdmin(getState()))) {
      return
    }
    if (app.component) {
      dispatch(
        openWindow({
          kind: app.component.kind,
          appKey: app.key,
          title: app.title,
          size: app.defaultSize,
        })
      )
      return
    }
    const page = app.ieRoute ? resolvePage(app.ieRoute) : undefined
    if (page?.redirect) {
      window.open(page.url, '_blank', 'noopener')
    }
  }
