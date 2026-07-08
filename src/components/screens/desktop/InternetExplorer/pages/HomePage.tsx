'use client'

import { DEFAULT_ROUTE, IE_PAGES } from '../ieRoutes'

import styles from './HomePage.module.css'

interface HomePageProps {
  onNavigate: (nickname: string) => void
  /** Redirect entries: opens the real URL in a new browser tab and shows the
   *  in-app redirect page. */
  onOpentab: (nickname: string) => void
}

const pageLinks = IE_PAGES.filter((page) => page.nickname !== DEFAULT_ROUTE)

export function HomePage({ onNavigate, onOpentab }: HomePageProps) {
  return (
    <div className={styles.homePage}>
      <h1 className={styles.heading}>Welcome to Internet Explorer</h1>
      <p className={styles.subtitle}>Select a page below to get started.</p>
      <div className={styles.tiles}>
        {pageLinks.map((page) => (
          <button
            key={page.nickname}
            className={styles.tile}
            onClick={() => (page.redirect ? onOpentab : onNavigate)(page.nickname)}
            type="button"
          >
            {page.title}
          </button>
        ))}
      </div>
    </div>
  )
}
