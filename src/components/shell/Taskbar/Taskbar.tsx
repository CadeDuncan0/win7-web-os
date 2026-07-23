'use client'

import { useMemo, useState } from 'react'

import { StartOrb } from './StartOrb'
import { SystemTray } from './SystemTray'
import styles from './Taskbar.module.css'
import { TaskbarIcon } from './TaskbarIcon'
import { StartMenu } from '@/components/shell/StartMenu'
import { TrayNotifications } from '@/components/shell/TrayNotifications'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  minimizeAll,
  selectOpenWindows,
  setPeek,
  type WindowInstance,
  type WindowKind,
} from '@/store/slices/windowSlice'

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
  const dispatch = useAppDispatch()
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false)
  const openWindows = useAppSelector(selectOpenWindows)
  const groups = useMemo(() => groupByKind(openWindows), [openWindows])

  return (
    <nav className={styles.taskbar + ' glass'} role="navigation" aria-label="Taskbar">
      {/* stopImmediatePropagation — NOT stopPropagation: in the App Router React
          delegates events at the document, the same node StartMenu's mousedown
          outside-click listener lives on. A synthetic stopPropagation can't stop
          a same-node native listener, so the orb's mousedown still closed the
          menu — which the orb's click then reopened. Stopping the native event
          immediately keeps the orb's click the sole toggle, so a click while the
          menu is open closes it. */}
      <div
        onMouseDown={(e) => e.nativeEvent.stopImmediatePropagation()}
        className={styles.orbWrapper}
      >
        <StartOrb
          isMenuOpen={isStartMenuOpen}
          onClick={() => setIsStartMenuOpen((prev) => !prev)}
        />
      </div>

      <div className={styles.buttonGroup}>
        {groups.map((group) => (
          <TaskbarIcon key={group.kind} kind={group.kind} windows={group.windows} />
        ))}
      </div>

      {/* Notification icons sit left of the clock, Win7 tray order. */}
      <TrayNotifications />

      <SystemTray />

      {/* Aero Peek: the slim rectangle past the clock — hovering previews the
          desktop (open windows turn to glass sheets), clicking minimizes all.
          Peek ends on click too: the windows are gone, nothing left to peek. */}
      <button
        className={styles.showDesktop}
        onClick={() => {
          dispatch(minimizeAll())
          dispatch(setPeek(false))
        }}
        onMouseEnter={() => dispatch(setPeek(true))}
        onMouseLeave={() => dispatch(setPeek(false))}
        aria-label="Show desktop"
        title="Show desktop"
        type="button"
      />

      <StartMenu isOpen={isStartMenuOpen} onClose={() => setIsStartMenuOpen(false)} />
    </nav>
  )
}
