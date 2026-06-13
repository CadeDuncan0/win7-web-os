'use client'

import { forwardRef } from 'react'

import styles from './TaskbarButton.module.css'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  focusWindow,
  minimizeWindow,
  selectTopWindowId,
  selectWindowById,
} from '@/store/slices/windowSlice'

export interface TaskbarButtonProps {
  windowId: string
}

export const TaskbarButton = forwardRef<HTMLButtonElement, TaskbarButtonProps>(
  function TaskbarButton({ windowId }, ref) {
    const dispatch = useAppDispatch()
    const windowData = useAppSelector(selectWindowById(windowId))
    const topWindowId = useAppSelector(selectTopWindowId)

    if (!windowData) {
      return null
    }

    const isActive = windowData.id === topWindowId && !windowData.isMinimized

    function handleClick() {
      if (windowData!.isMinimized) {
        dispatch(focusWindow({ id: windowId }))
      } else if (isActive) {
        dispatch(minimizeWindow({ id: windowId }))
      } else {
        dispatch(focusWindow({ id: windowId }))
      }
    }

    const buttonClass = [
      styles.taskbarButton,
      isActive && styles.active,
      windowData.isMinimized && styles.minimized,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        ref={ref}
        className={buttonClass}
        onClick={handleClick}
        aria-label={windowData.title}
        aria-pressed={isActive}
        type="button"
        title={windowData.title}
      >
        <span className={styles.label}>{windowData.title}</span>
      </button>
    )
  }
)
