'use client'

import styles from './IEPageLinks.module.css'
import { IE_PAGES } from './ieRoutes'

interface IEPageLinksProps {
  onNavigate: (nickname: string) => void
}

/**
 * Blue underlined page links pinned to the top-left of the window content,
 * replacing the former favorites bar. One link per in-app IE page. The targets
 * are in-app routes (not real URLs), so each link is a button styled to read as
 * a classic hyperlink.
 */
export function IEPageLinks({ onNavigate }: IEPageLinksProps) {
  return (
    <nav className={styles.pageLinks} aria-label="Pages">
      {IE_PAGES.map((page) => (
        <button
          key={page.nickname}
          className={styles.link}
          onClick={() => onNavigate(page.nickname)}
          type="button"
        >
          {page.title}
        </button>
      ))}
    </nav>
  )
}
