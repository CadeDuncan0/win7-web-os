'use client'

/** Redux-wired window wrapper. Reads geometry and focus state from windowSlice
 *  by id, wires title-bar controls to dispatch actions, and composes the
 *  stateless 7.css <Window> primitive inside a positioned shell. */

import type { CSSProperties, ReactNode } from 'react'

import styles from './ManagedWindow.module.css'
import { Window } from '@/components/windows7/Window'
import { useWindowDrag } from '@/hooks/useWindowDrag'
import { TASKBAR_RESERVE } from '@/lib/gridMath'
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

  const drag = useWindowDrag({
    windowId,
    position: windowData?.position ?? { x: 0, y: 0 },
    size: windowData?.size ?? { width: 0, height: 0 },
    isMaximized: windowData?.isMaximized ?? false,
  })

  if (!windowData) {
    return null
  }

  const isActive = windowData.id === topWindowId

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dispatch(focusWindow({ id: windowId }))
    drag.handlePointerDown(e)
  }

  function handleClose() {
    dispatch(closeWindow({ id: windowId }))
  }

  function handleMinimize() {
    dispatch(minimizeWindow({ id: windowId }))
  }

  function handleToggleMaximize() {
    const taskbarHeight =
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--dsk-taskbar-reserve'),
        10
      ) || TASKBAR_RESERVE
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

  const wrapperClass = drag.isDragging
    ? `${styles.managedWindow} ${styles.dragging}`
    : styles.managedWindow

  const style: CSSProperties = {
    position: 'absolute',
    left: windowData.position.x + drag.dragOffset.x,
    top: windowData.position.y + drag.dragOffset.y,
    width: windowData.size.width,
    height: windowData.size.height,
    zIndex: windowData.zIndex,
  }

  return (
    <div
      className={wrapperClass}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={drag.handlePointerMove}
      onPointerUp={drag.handlePointerUp}
      data-testid={`managed-window-${windowId}`}
    >
      <Window title={windowData.title} active={isActive} glass controls={controls}>
        {children}
      </Window>
    </div>
  )
}
