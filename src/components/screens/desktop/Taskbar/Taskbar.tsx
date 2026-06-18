'use client'

import { useMemo, useState } from 'react'

import { StartOrb } from './StartOrb'
import { SystemTray } from './SystemTray'
import styles from './Taskbar.module.css'
import { TaskbarButton } from './TaskbarButton'
import { StartMenu } from '@/components/screens/desktop/StartMenu'
import { useAppSelector } from '@/store/hooks'
import { selectOpenWindows, type WindowInstance, type WindowKind } from '@/store/slices/windowSlice'

// Compact open windows into one entry per application (`kind`), preserving the
// order in which each app's first window was opened.
function groupByKind(
  windows: WindowInstance[]
): Array<{ kind: WindowKind; windows: WindowInstance[] }> {
  const groups: Array<{ kind: WindowKind; windows: WindowInstance[] }> = []
  for (const win of windows) {
    const group = groups.find((g) => g.kind === win.kind)
    if (group) {
      group.windows.push(win)
    } else {
      groups.push({ kind: win.kind, windows: [win] })
    }
  }
  return groups
}

export function Taskbar() {
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false)
  const openWindows = useAppSelector(selectOpenWindows)
  const groups = useMemo(() => groupByKind(openWindows), [openWindows])

  return (
    <nav className={styles.taskbar} role="navigation" aria-label="Taskbar">
      <div onMouseDown={(e) => e.stopPropagation()} className={styles.orbWrapper}>
        <StartOrb
          isMenuOpen={isStartMenuOpen}
          onClick={() => setIsStartMenuOpen((prev) => !prev)}
        />
      </div>

      <div className={styles.buttonGroup}>
        {groups.map((group) => (
          <TaskbarButton key={group.kind} kind={group.kind} windows={group.windows} />
        ))}
      </div>

      <SystemTray />

      <StartMenu isOpen={isStartMenuOpen} onClose={() => setIsStartMenuOpen(false)} />
    </nav>
  )
}
