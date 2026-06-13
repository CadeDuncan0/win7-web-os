'use client'

import styles from './ExternalLinkPage.module.css'

interface ExternalLinkPageProps {
  title: string
  url: string
}

export function ExternalLinkPage({ title, url }: ExternalLinkPageProps) {
  function handleOpen() {
    window.open(url, '_blank', 'noopener')
  }

  return (
    <div className={styles.externalLinkPage}>
      <div className={styles.card}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.url}>{url}</p>
        <button className={styles.openBtn} onClick={handleOpen} type="button">
          Open in new tab
        </button>
        <p className={styles.note}>External links open outside the portfolio</p>
      </div>
    </div>
  )
}
