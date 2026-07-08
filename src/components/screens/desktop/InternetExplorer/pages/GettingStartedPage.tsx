'use client'

import styles from './GettingStartedPage.module.css'

/** Placeholder page showing forkers where the scaffold's content plugs in. */
export function GettingStartedPage() {
  return (
    <div className={styles.gettingStartedPage}>
      <h1 className={styles.heading}>Getting Started</h1>
      <div className={styles.card}>
        <p>
          This desktop is a scaffold — fork it and make it your own. Identity values (site URL,
          external links, branding) live in one config module:
        </p>
        <p>
          <code className={styles.path}>src/config/site.ts</code>
        </p>
        <p>
          Desktop icons, Start Menu shortcuts, and the pages inside this browser are plain data
          registries next to the components that render them. Add a new app by extending the
          <code className={styles.path}> WindowKind</code> union and giving it a case in the
          WindowManager.
        </p>
      </div>
    </div>
  )
}
