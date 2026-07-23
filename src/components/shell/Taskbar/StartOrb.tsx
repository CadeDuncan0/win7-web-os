'use client'

import styles from './StartOrb.module.css'

export interface StartOrbProps {
  isMenuOpen: boolean
  onClick: () => void
}

export function StartOrb({ isMenuOpen, onClick }: StartOrbProps) {
  const orbClass = [styles.startOrb, isMenuOpen && styles.active].filter(Boolean).join(' ')

  return (
    <button
      className={orbClass}
      onClick={onClick}
      aria-label="Start"
      aria-expanded={isMenuOpen}
      aria-haspopup="menu"
      type="button"
    />
  )
}
