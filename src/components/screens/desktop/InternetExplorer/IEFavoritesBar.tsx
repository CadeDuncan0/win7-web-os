'use client'

import styles from './IEFavoritesBar.module.css'
import { DEFAULT_ROUTE, IE_ROUTES } from './ieRoutes'

interface IEFavoritesBarProps {
  onNavigate: (url: string) => void
}

const bookmarks = Object.values(IE_ROUTES).filter((route) => route.url !== DEFAULT_ROUTE)

export function IEFavoritesBar({ onNavigate }: IEFavoritesBarProps) {
  return (
    <div className={styles.favoritesBar} role="toolbar" aria-label="Favorites">
      <span className={styles.star} aria-hidden="true">
        ★
      </span>
      {bookmarks.map((route) => (
        <button
          key={route.url}
          className={styles.bookmark}
          onClick={() => onNavigate(route.url)}
          type="button"
        >
          {route.title}
        </button>
      ))}
    </div>
  )
}
