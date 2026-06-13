'use client'

import { IEFavoritesBar } from './IEFavoritesBar'
import { DEFAULT_ROUTE, resolveRoute } from './ieRoutes'
import { IEToolbar } from './IEToolbar'
import styles from './InternetExplorerWindow.module.css'
import { ExternalLinkPage, HomePage, ProjectsPage, ResumePage } from './pages'
import { useIENavigation } from './useIENavigation'

export interface InternetExplorerWindowProps {
  initialRoute?: string
}

export function InternetExplorerWindow({ initialRoute }: InternetExplorerWindowProps) {
  const nav = useIENavigation(initialRoute ?? DEFAULT_ROUTE)
  const route = resolveRoute(nav.currentUrl)

  function renderContent() {
    if (!route) {
      return <div>Page not found: {nav.currentUrl}</div>
    }

    if (route.type === 'external') {
      return <ExternalLinkPage title={route.title} url={route.externalUrl!} />
    }

    switch (nav.currentUrl) {
      case 'about:home':
        return <HomePage onNavigate={nav.navigate} />
      case 'portfolio://resume':
        return <ResumePage />
      case 'portfolio://projects':
        return <ProjectsPage />
      default:
        return <div>Page not found: {nav.currentUrl}</div>
    }
  }

  return (
    <div className={styles.ieWindow}>
      <IEToolbar
        currentUrl={nav.currentUrl}
        canGoBack={nav.canGoBack}
        canGoForward={nav.canGoForward}
        onBack={nav.goBack}
        onForward={nav.goForward}
        onRefresh={() => nav.navigate(DEFAULT_ROUTE)}
      />
      <IEFavoritesBar onNavigate={nav.navigate} />
      <div className={styles.content}>{renderContent()}</div>
    </div>
  )
}
