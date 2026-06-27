'use client'

import { DEFAULT_ROUTE, IE_EXTERNAL_LINKS, IE_PAGES } from '../ieRoutes'

import styles from './HomePage.module.css'

interface HomePageProps {
  onNavigate: (nickname: string) => void
}

const pageLinks = IE_PAGES.filter((page) => page.nickname !== DEFAULT_ROUTE)

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className={styles.homePage}>
      <h1 className={styles.heading}>Welcome to Internet Explorer</h1>
      <p className={styles.subtitle}>Select a page below to get started.</p>
      <div className={styles.tiles}>
        {pageLinks.map((page) => (
          <button
            key={page.nickname}
            className={styles.tile}
            onClick={() => onNavigate(page.nickname)}
            type="button"
          >
            {page.title}
          </button>
        ))}
        {IE_EXTERNAL_LINKS.map((link) => (
          <button
            key={link.url}
            className={styles.tile}
            onClick={() => window.open(link.url, '_blank', 'noopener')}
            type="button"
          >
            {link.title}
          </button>
        ))}
      </div>
    </div>
  )
}
