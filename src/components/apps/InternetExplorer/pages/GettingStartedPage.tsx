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
                change lives in plain data registries next to the components that render them:
              </p>
              <p className={styles.para}>
                <code className={styles.path}>desktopIcons.ts</code> (desktop icons),{' '}
                <code className={styles.path}>startMenuItems.ts</code> (Start Menu shortcuts and
                external links), and <code className={styles.path}>ieRoutes.ts</code> (the pages in
                this browser — entries with <code className={styles.path}>redirect: true</code> open
                in a new browser tab).
              </p>
              <p className={styles.para}>
                Add a new app by extending the
                <code className={styles.path}> WindowKind</code> union and giving it a case in the
                WindowManager.
              </p>
            </div>
          </article>
        </div>

        <IESidebar onNavigate={onNavigate} onOpentab={onOpentab} />
      </div>
    </div>
  )
}
