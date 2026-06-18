'use client'

import { taskbarAppMeta } from './taskbarApps'
import styles from './TaskbarButton.module.css'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  closeWindow,
  focusWindow,
  minimizeWindow,
  selectTopWindowId,
  type WindowInstance,
  type WindowKind,
} from '@/store/slices/windowSlice'

export interface TaskbarButtonProps {
  // All open windows of a single application (same `kind`), compacted into one
  // square taskbar button. Hover/focus reveals a popup listing each window.
  kind: WindowKind
  windows: WindowInstance[]
}

export function TaskbarButton({ kind, windows }: TaskbarButtonProps) {
  const dispatch = useAppDispatch()
  const topWindowId = useAppSelector(selectTopWindowId)

  const { icon, label } = taskbarAppMeta(kind)

  // The group's representative window: the most-recently-focused (highest z).
  const topInGroup = windows.reduce((top, win) => (win.zIndex > top.zIndex ? win : top), windows[0])
  const isActive = windows.some((win) => win.id === topWindowId && !win.isMinimized)
  const isSingle = windows.length === 1

  // Per-window toggle (Win7 taskbar semantics): restore-and-focus a minimized
  // window, minimize the active window, otherwise focus.
  function toggle(win: WindowInstance) {
    if (win.isMinimized) {
      dispatch(focusWindow({ id: win.id }))
    } else if (win.id === topWindowId) {
      dispatch(minimizeWindow({ id: win.id }))
    } else {
      dispatch(focusWindow({ id: win.id }))
    }
  }

  function handleMainClick() {
    // Single window: act on it directly. Multiple: bring the app forward — the
    // popup is how a specific window is chosen.
    if (isSingle) {
      toggle(topInGroup)
    } else {
      dispatch(focusWindow({ id: topInGroup.id }))
    }
  }

  const buttonClass = [styles.taskbarButton, isActive && styles.active].filter(Boolean).join(' ')

  return (
    <div className={styles.group}>
      <button
        className={buttonClass}
        onClick={handleMainClick}
        aria-label={label}
        aria-pressed={isActive}
        title={label}
        type="button"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.icon} src={icon} alt="" width={24} height={24} draggable={false} />
      </button>

      <ul className={styles.popup}>
        {windows.map((win) => (
          <li key={win.id} className={styles.popupItem}>
            <button
              className={styles.popupActivate}
              onClick={() => toggle(win)}
              aria-label={win.title}
              type="button"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.popupIcon}
                src={icon}
                alt=""
                width={20}
                height={20}
                draggable={false}
              />
              <span className={styles.popupLabel}>{win.title}</span>
            </button>
            <button
              className={styles.popupClose}
              onClick={() => dispatch(closeWindow({ id: win.id }))}
              aria-label={`Close ${win.title}`}
              title={`Close ${win.title}`}
              type="button"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
