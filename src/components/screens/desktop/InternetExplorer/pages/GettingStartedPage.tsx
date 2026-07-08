'use client'

import styles from './GettingStartedPage.module.css'

/** Placeholder page showing forkers where the scaffold's content plugs in. */
export function GettingStartedPage() {
  return (
    <div className={styles.gettingStartedPage}>
      <h1 className={styles.heading}>Getting Started</h1>
      <div className={styles.card}>
        <p>
          This desktop is a template — fork it and make it your own. Everything you would change
          lives in plain data registries next to the components that render them:
        </p>
        <p>
          <code className={styles.path}>desktopIcons.ts</code> (desktop icons),{' '}
          <code className={styles.path}>startMenuItems.ts</code> (Start Menu shortcuts and
          external links), and <code className={styles.path}>ieRoutes.ts</code> (the pages in this
          browser — entries with <code className={styles.path}>redirect: true</code> open in a new
          browser tab).
        </p>
        <p>
          Add a new app by extending the
          <code className={styles.path}> WindowKind</code> union and giving it a case in the
          WindowManager.
        </p>
      </div>
    </div>
  )
}
