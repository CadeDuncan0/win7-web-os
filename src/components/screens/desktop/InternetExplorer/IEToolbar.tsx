'use client'

import styles from './IEToolbar.module.css'

interface IEToolbarProps {
  currentUrl: string
  canGoBack: boolean
  canGoForward: boolean
  onBack: () => void
  onForward: () => void
  onRefresh: () => void
}

export function IEToolbar({
  currentUrl,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onRefresh,
}: IEToolbarProps) {
  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Navigation">
      <div className={styles.navButtons}>
        <button
          className={[styles.backBtn, !canGoBack && styles.disabled].filter(Boolean).join(' ')}
          onClick={onBack}
          disabled={!canGoBack}
          aria-label="Back"
          type="button"
        >
          <span className={styles.arrow} aria-hidden="true">
            ◀
          </span>
        </button>
        <button
          className={[styles.fwdBtn, !canGoForward && styles.disabled].filter(Boolean).join(' ')}
          onClick={onForward}
          disabled={!canGoForward}
          aria-label="Forward"
          type="button"
        >
          <span className={styles.arrow} aria-hidden="true">
            ▶
          </span>
        </button>
      </div>

      <div className={styles.addressBar}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.favicon}
          src="/imgs/windows7/assets/internetexplorer_logo.png"
          alt=""
          aria-hidden="true"
        />
        <span className={styles.addressText}>{currentUrl}</span>
        <button className={styles.refreshBtn} onClick={onRefresh} aria-label="Home" type="button">
          <span aria-hidden="true">⟳</span>
        </button>
      </div>
    </div>
  )
}
