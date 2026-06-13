'use client'

import { DEFAULT_ROUTE, IE_ROUTES } from '../ieRoutes'

import styles from './HomePage.module.css'

interface HomePageProps {
  onNavigate: (url: string) => void
}

const quickLinks = Object.values(IE_ROUTES).filter((route) => route.url !== DEFAULT_ROUTE)

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className={styles.homePage}>
      <h1 className={styles.heading}>Welcome to Internet Explorer</h1>
      <p className={styles.subtitle}>Select a page below to get started.</p>
      <div className={styles.tiles}>
        {quickLinks.map((route) => (
          <button
            key={route.url}
            className={styles.tile}
            onClick={() => onNavigate(route.url)}
            type="button"
          >
            {route.title}
          </button>
        ))}
      </div>
    </div>
  )
}
