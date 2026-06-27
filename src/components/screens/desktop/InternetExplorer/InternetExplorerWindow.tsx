'use client'

import { WindowWrapper } from '../WindowWrapper'
import { IEPageLinks } from './IEPageLinks'
import { DEFAULT_ROUTE, resolvePage } from './ieRoutes'
import { IEToolbar } from './IEToolbar'
import styles from './InternetExplorerWindow.module.css'
import { HomePage, ProjectsPage, ResumePage } from './pages'
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

  function renderContent() {
    switch (nav.currentUrl) {
      case 'about:home':
        return <HomePage onNavigate={nav.navigate} />
      case 'portfolio://resume':
        return <ResumePage />
      case 'portfolio://projects':
        return <ProjectsPage />
      default: {
        const page = resolvePage(nav.currentUrl)
        return <div className={styles.notFound}>Page not found: {page?.url ?? nav.currentUrl}</div>
      }
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
        <IEPageLinks onNavigate={nav.navigate} />
        {/* reloadKey changes on navigation and refresh, remounting the page so a
            refresh re-runs it without adding a history entry. */}
        <div key={nav.reloadKey} className={styles.content}>
          {renderContent()}
        </div>
      </div>
    </WindowWrapper>
  )
}
