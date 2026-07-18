'use client'

import { IEPageLinks } from './IEPageLinks'
import { IEToolbar } from './IEToolbar'
import styles from './InternetExplorerWindow.module.css'
import { GettingStartedPage, HomePage, NotFoundPage, RedirectPage } from './pages'
import { useIENavigation } from './useIENavigation'
import { WindowWrapper } from '@/components/shell/WindowWrapper'
import { DEFAULT_ROUTE, resolvePage } from '@/config/ieRoutes'
import { assetPaths, withBasePath } from '@/lib/assetPaths'

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
  // Resolve through the enabled registry first: a disabled (or unknown, or
  // non-redirect) nickname resolves to nothing here, so it can never leave the
  // sandbox — this is the gate that a filtered-out link cannot bypass.
  function handleOpentab(nickname: string) {
    const page = resolvePage(nickname)
    if (!page?.redirect) {
      return
    }
    nav.opentab(nickname)
    window.open(page.url, '_blank', 'noopener')
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
        return <GettingStartedPage onNavigate={nav.navigate} onOpentab={handleOpentab} />
      default:
        return <NotFoundPage url={page?.url ?? nav.currentUrl} />
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
      src={withBasePath(assetPaths.desktopIcons.internetExplorer)}
      alt=""
      aria-hidden="true"
    />
  )

  const currentPage = resolvePage(nav.currentUrl)

  return (
    <WindowWrapper windowId={windowId} icon={icon} toolbar={toolbar} bodySpace={false}>
      <div className={styles.ieBody}>
        {/* IE7-style single-tab strip. Decorative chrome (hence aria-hidden):
            the star and new-tab stub don't act; the tab mirrors the page the
            window is already on. */}
        <div className={styles.tabStrip} aria-hidden="true">
          <span className={styles.favStar}>★</span>
          <div className={styles.tab}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.tabFavicon}
              src={withBasePath(assetPaths.desktopIcons.internetExplorer)}
              alt=""
            />
            <span className={styles.tabTitle}>{currentPage?.title ?? nav.currentUrl}</span>
          </div>
          <div className={styles.tabStub} />
        </div>
        <IEPageLinks onNavigate={nav.navigate} onOpentab={handleOpentab} />
        {/* reloadKey changes on navigation and refresh, remounting the page so a
            refresh re-runs it without adding a history entry. */}
        <div key={nav.reloadKey} className={styles.content}>
          {renderContent()}
        </div>
        {/* IE7 status bar — Done · security zone · zoom, all static chrome. */}
        <div className={styles.statusBar} aria-hidden="true">
          <span className={styles.statusDone}>Done</span>
          <span className={styles.statusSegment}>Internet | Protected Mode: Off</span>
          <span className={styles.statusSegment}>100%</span>
        </div>
      </div>
    </WindowWrapper>
  )
}
