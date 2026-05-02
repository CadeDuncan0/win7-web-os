import type { ReactNode } from 'react'

import styles from './GlassSurface.module.css'

interface GlassSurfaceProps {
  children: ReactNode
  className?: string
}

export function GlassSurface({ children, className }: GlassSurfaceProps) {
  const classes = className ? `${styles.surface} ${className}` : styles.surface
  return <div className={classes}>{children}</div>
}
