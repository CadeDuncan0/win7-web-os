'use client'

/** Redux-wired window wrapper. Reads geometry and focus state from windowSlice
 *  by id, wires title-bar controls to dispatch actions, and composes the
 *  stateless 7.css <Window> primitive inside a positioned shell. */

import type { CSSProperties, ReactNode } from 'react'

import styles from './ManagedWindow.module.css'
import { Window } from '@/components/windows7/Window'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  closeWindow,
  focusWindow,
  minimizeWindow,
  selectTopWindowId,
  selectWindowById,
  toggleMaximize,
} from '@/store/slices/windowSlice'

export interface ManagedWindowProps {
  windowId: string
  children?: ReactNode
}

export function ManagedWindow({ windowId, children }: ManagedWindowProps) {
  const dispatch = useAppDispatch()
  const windowData = useAppSelector(selectWindowById(windowId))
  const topWindowId = useAppSelector(selectTopWindowId)

  if (!windowData) {
    return null
  }

  const isActive = windowData.id === topWindowId

  // Fires before mousedown/click — ensures z-index promotion happens
  // before any child handler (title-bar buttons, future drag handler)
  function handlePointerDown() {
    dispatch(focusWindow({ id: windowId }))
  }

  function handleClose() {
    dispatch(closeWindow({ id: windowId }))
  }

  function handleMinimize() {
    dispatch(minimizeWindow({ id: windowId }))
  }

  // Reads taskbar height from CSS at dispatch time so viewport changes are captured
  function handleToggleMaximize() {
    const taskbarHeight =
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--dsk-taskbar-reserve'),
        10
      ) || 40
    dispatch(
      toggleMaximize({
        id: windowId,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight - taskbarHeight,
        },
      })
    )
  }

  // 7.css renders button icons based on aria-label attribute selectors
  const controls = (
    <>
      <button aria-label="Minimize" onClick={handleMinimize} />
      <button
        aria-label={windowData.isMaximized ? 'Restore' : 'Maximize'}
        onClick={handleToggleMaximize}
      />
      <button aria-label="Close" onClick={handleClose} />
    </>
  )

  const style: CSSProperties = {
    position: 'absolute',
    left: windowData.position.x,
    top: windowData.position.y,
    width: windowData.size.width,
    height: windowData.size.height,
    zIndex: windowData.zIndex,
  }

  return (
    <div
      className={styles.managedWindow}
      style={style}
      onPointerDown={handlePointerDown}
      data-testid={`managed-window-${windowId}`}
    >
      <Window title={windowData.title} active={isActive} glass controls={controls}>
        {children}
      </Window>
    </div>
  )
}
