// Pure presentational component — NO 'use client', no hooks, no state.
// Accepts named slot props for each stacking layer.

import { ReactNode } from 'react'
import styles from './Desktop.module.css'

interface DesktopProps {
  iconGrid?: ReactNode
  windowLayer?: ReactNode
  overlay?: ReactNode
}

export const Desktop = ({ iconGrid, windowLayer, overlay }: DesktopProps) => {
  return (
    <div className={styles.shell} role="main" aria-label="Desktop">
      <div className={styles.iconLayer}>{iconGrid}</div>
      <div className={styles.windowLayer}>{windowLayer}</div>
      <div className={styles.overlay}>{overlay} </div>
    </div>
  )
}
