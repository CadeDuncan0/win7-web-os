'use client'

import { useRef, useState } from 'react'

import { StartOrb } from './StartOrb'
import { SystemTray } from './SystemTray'
import styles from './Taskbar.module.css'
import { TaskbarButton } from './TaskbarButton'
import { StartMenu } from '@/components/screens/desktop/StartMenu'
import { useAppSelector } from '@/store/hooks'
import { selectOpenWindows } from '@/store/slices/windowSlice'

export function Taskbar() {
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false)
  const openWindows = useAppSelector(selectOpenWindows)
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  return (
    <nav className={styles.taskbar} role="navigation" aria-label="Taskbar">
      <div onMouseDown={(e) => e.stopPropagation()} className={styles.orbWrapper}>
        <StartOrb
          isMenuOpen={isStartMenuOpen}
          onClick={() => setIsStartMenuOpen((prev) => !prev)}
        />
      </div>

      <div className={styles.buttonGroup}>
        {openWindows.map((win) => (
          <TaskbarButton
            key={win.id}
            windowId={win.id}
            ref={(el) => {
              buttonRefs.current[win.id] = el
            }}
          />
        ))}
      </div>

      <SystemTray />

      <StartMenu isOpen={isStartMenuOpen} onClose={() => setIsStartMenuOpen(false)} />
    </nav>
  )
}
