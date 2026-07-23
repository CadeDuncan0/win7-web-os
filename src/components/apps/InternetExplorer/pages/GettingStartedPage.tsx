'use client'

import styles from './GettingStartedPage.module.css'
import portal from './IEPortal.module.css'
import { IESidebar } from './IESidebar'

interface GettingStartedPageProps {
  onNavigate: (nickname: string) => void
  onOpentab: (nickname: string) => void
}

/** Placeholder page showing forkers where the scaffold's content plugs in,
 *  laid out as a period help "article" (header band + content module + rail). */
export function GettingStartedPage({ onNavigate, onOpentab }: GettingStartedPageProps) {
  return (
    <div className={portal.pageShell}>
      <header className={portal.headerBand}>
        <h1 className={portal.bandTitle}>Getting Started</h1>
        <p className={portal.bandTagline}>Fork this desktop and make it your own.</p>
      </header>

      <div className={portal.columns}>
        <div className={portal.main}>
          <article className={portal.module}>
            <div className={portal.moduleHeader}>Customizing your desktop</div>
            <div className={portal.moduleBody}>
              <p className={styles.para}>
                This desktop is a template — fork it and make it your own. Everything you would
                change lives in plain data registries under{' '}
                <code className={styles.path}>src/config/</code>:
              </p>
              <p className={styles.para}>
                <code className={styles.path}>applications.ts</code> (one record per app — its
                desktop icon, Start Menu shortcut, window component, and taskbar meta all derive
                from it), <code className={styles.path}>notifications.ts</code> (tray balloons), and{' '}
                <code className={styles.path}>ieRoutes.ts</code> (the pages in this browser —
                entries with <code className={styles.path}>redirect: true</code> open in a new
                browser tab).
              </p>
              <p className={styles.para}>
                Add a new app by extending the
                <code className={styles.path}> WindowKind</code> union and adding one{' '}
                <code className={styles.path}>Application</code> record — every launcher and the
                window renderer pick it up from there.
              </p>
            </div>
          </article>
        </div>

        <IESidebar onNavigate={onNavigate} onOpentab={onOpentab} />
      </div>
    </div>
  )
}
