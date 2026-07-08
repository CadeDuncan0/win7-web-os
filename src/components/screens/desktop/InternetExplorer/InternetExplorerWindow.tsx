'use client'

import { WindowWrapper } from '../WindowWrapper'
import { IEPageLinks } from './IEPageLinks'
import { DEFAULT_ROUTE, pageUrl, resolvePage } from './ieRoutes'
import { IEToolbar } from './IEToolbar'
import styles from './InternetExplorerWindow.module.css'
import { GettingStartedPage, HomePage, RedirectPage } from './pages'
import { useIENavigation } from './useIENavigation'
import { assetPaths } from '@/lib/assetPaths'

export interface InternetExplorerWindowProps {
  /** Redux window id — wires the OS chrome (geometry, focus, controls). */
  windowId: string
  /** Nickname of the page to open on. Defaults to the home page. */
  initialRoute?: string
}

export function InternetExplorerWindow({ windowId, initialRoute }: InternetExplorerWindowProps) {
  const nav = useIENavigation(initialRoute ?? DEFAULT_ROUTE)

  // Redirect entries: open the real destination in a new browser tab and show
  // the in-app redirect page. window.open stays in this click-path handler (not
  // the page component) so revisiting via back/forward or refresh never
  // re-opens the tab unprompted — the page's manual link covers those cases.
  function handleOpentab(nickname: string) {
    nav.opentab(nickname)
    window.open(pageUrl(nickname), '_blank', 'noopener')
  }

  function renderContent() {
    const page = resolvePage(nav.currentUrl)
    if (page?.redirect) {
      return <RedirectPage page={page} />
    }
    switch (nav.currentUrl) {
      case 'about:home':
        return <HomePage onNavigate={nav.navigate} onOpentab={handleOpentab} />
      case 'about:getting-started':
        return <GettingStartedPage />
      default:
        return <div className={styles.notFound}>Page not found: {page?.url ?? nav.currentUrl}</div>
    }
  }

  const toolbar = (
    <IEToolbar
      currentUrl={nav.currentUrl}
      canGoBack={nav.canGoBack}
      canGoForward={nav.canGoForward}
      onBack={nav.goBack}
      onForward={nav.goForward}
      onRefresh={nav.refresh}
      onNavigate={nav.navigate}
      onOpentab={handleOpentab}
    />
  )

  const icon = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={styles.titleBarIcon}
      src={assetPaths.desktopIcons.internetExplorer}
      alt=""
      aria-hidden="true"
    />
  )

  return (
    <WindowWrapper windowId={windowId} icon={icon} toolbar={toolbar} bodySpace={false}>
      <div className={styles.ieBody}>
        <IEPageLinks onNavigate={nav.navigate} onOpentab={handleOpentab} />
        {/* reloadKey changes on navigation and refresh, remounting the page so a
            refresh re-runs it without adding a history entry. */}
        <div key={nav.reloadKey} className={styles.content}>
          {renderContent()}
        </div>
      </div>
    </WindowWrapper>
  )
}
