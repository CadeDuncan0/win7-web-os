'use client'

import { useEffect, useState } from 'react'

import styles from './SystemTray.module.css'

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'numeric',
  day: 'numeric',
  year: 'numeric',
})

export interface SystemTrayProps {
  initialDate?: Date
}

export function SystemTray({ initialDate }: SystemTrayProps) {
  const [now, setNow] = useState(() => initialDate ?? new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={styles.systemTray} role="status" aria-label="System tray">
      <time className={styles.time} dateTime={now.toISOString()}>
        {timeFormatter.format(now)}
      </time>
      <time className={styles.date} dateTime={now.toISOString()}>
        {dateFormatter.format(now)}
      </time>
    </div>
  )
}
