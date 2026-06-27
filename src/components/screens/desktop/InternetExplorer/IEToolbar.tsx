'use client'

import { IEAddressBar } from './IEAddressBar'
import styles from './IEToolbar.module.css'
import { ArrowButton } from '@/components/windows7/ArrowButton'

interface IEToolbarProps {
  currentUrl: string
  canGoBack: boolean
  canGoForward: boolean
  onBack: () => void
  onForward: () => void
  onRefresh: () => void
  onNavigate: (nickname: string) => void
}

export function IEToolbar({
  currentUrl,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onRefresh,
  onNavigate,
}: IEToolbarProps) {
  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Navigation">
      <div className={styles.navButtons}>
        {/* Equal-sized Aero arrow buttons; the Back arrow is the Forward arrow
            mirrored. Disabled when there is no history in that direction. */}
        <ArrowButton
          className={`${styles.navBtn} ${styles.navBtnBack}`}
          onClick={onBack}
          disabled={!canGoBack}
          aria-label="Back"
        />
        <ArrowButton
          className={styles.navBtn}
          onClick={onForward}
          disabled={!canGoForward}
          aria-label="Forward"
        />
      </div>

      <IEAddressBar currentUrl={currentUrl} onNavigate={onNavigate} onRefresh={onRefresh} />
    </div>
  )
}
