'use client'

import type { IEPage } from '../ieRoutes'

import styles from './RedirectPage.module.css'
import { Spinner } from '@/components/windows7/Spinner'

interface RedirectPageProps {
  /** The `redirect: true` registry entry whose `url` opened in a new tab. */
  page: IEPage
}

/**
 * Shown inside IE when a `redirect: true` entry is selected. The real
 * destination opens in a new browser tab at the moment of selection (see
 * `onOpentab` in InternetExplorerWindow); this page is what IE itself displays,
 * with a manual link as the popup-blocked / revisit fallback.
 */
export function RedirectPage({ page }: RedirectPageProps) {
  return (
    <div className={styles.redirectPage}>
      <div className={styles.redirectMessage}>
        <Spinner aria-hidden="true" aria-label="animated" />
        <p className={styles.message}>A new tab is opening in your browser…</p>
      </div>
      <p className={styles.fallback}>
        If nothing happens,{' '}
        <a className={styles.link} href={page.url} target="_blank" rel="noopener noreferrer">
          click here
        </a>{' '}
        to open {page.title} in a new tab.
      </p>
    </div>
  )
}
