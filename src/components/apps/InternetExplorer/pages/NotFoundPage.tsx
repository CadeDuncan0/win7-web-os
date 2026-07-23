'use client'

import portal from './IEPortal.module.css'
import styles from './NotFoundPage.module.css'

interface NotFoundPageProps {
  /** The address that failed to resolve (a nickname or full URL). */
  url: string
}

/** The period IE "This page cannot be displayed" error, shown for an unknown or
 *  disabled route. Same portal chrome as the other pages so it never reads as a
 *  bare white document. */
export function NotFoundPage({ url }: NotFoundPageProps) {
  return (
    <div className={portal.pageShell}>
      <header className={portal.headerBand}>
        <h1 className={portal.bandTitle}>This page cannot be displayed</h1>
        <p className={portal.bandTagline}>Internet Explorer cannot find the page you requested.</p>
      </header>

      <section className={portal.module}>
        <div className={portal.moduleHeader}>What you can try</div>
        <div className={portal.moduleBody}>
          <p className={styles.para}>
            The address <code className={styles.addr}>{url}</code> is not a page on this site.
          </p>
          <ul className={styles.tips}>
            <li>Check that the address is spelled correctly.</li>
            <li>Use the links along the top of the window to reach a known page.</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
