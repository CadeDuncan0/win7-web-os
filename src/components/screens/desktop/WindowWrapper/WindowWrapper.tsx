'use client'

/** Redux-wired window wrapper. Reads geometry and focus state from windowSlice
 *  by id, wires title-bar controls to dispatch actions, and composes the
 *  stateless 7.css <Window> primitive inside a positioned shell. */

import { motion } from 'framer-motion'
import { type CSSProperties, type ReactNode, useRef } from 'react'

import styles from './WindowWrapper.module.css'
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

export interface WindowWrapperProps {
  windowId: string
  children?: ReactNode
}

export function WindowWrapper({ windowId, children }: WindowWrapperProps) {
  const dispatch = useAppDispatch()
  const windowData = useAppSelector(selectWindowById(windowId))
  const topWindowId = useAppSelector(selectTopWindowId)

  const exitModeRef = useRef<'close' | 'minimize'>('close')

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
    exitModeRef.current = 'close'
    dispatch(closeWindow({ id: windowId }))
  }

  function handleMinimize() {
    exitModeRef.current = 'minimize'
    dispatch(minimizeWindow({ id: windowId }))
  }

  function getViewport() {
    const taskbarHeight =
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--dsk-taskbar-reserve'),
        10
      ) || TASKBAR_RESERVE
    return {
      width: window.innerWidth,
      height: window.innerHeight - taskbarHeight,
    }
  }

  function handleToggleMaximize() {
    dispatch(toggleMaximize({ id: windowId, viewport: getViewport() }))
  }

  function handleDoubleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!(e.target as Element).closest('.title-bar')) {
      return
    }
    if ((e.target as Element).closest('.title-bar-controls')) {
      return
    }
    dispatch(toggleMaximize({ id: windowId, viewport: getViewport() }))
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

  const wrapperClass = [
    styles.WindowWrapper,
    drag.isDragging && styles.dragging,
    windowData.isMaximized && styles.maximized,
  ]
    .filter(Boolean)
    .join(' ')

  const style: CSSProperties = {
    position: 'absolute',
    left: windowData.position.x + drag.dragOffset.x,
    top: windowData.position.y + drag.dragOffset.y,
    width: windowData.size.width,
    height: windowData.size.height,
    zIndex: windowData.zIndex,
  }

  const variants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: () =>
      exitModeRef.current === 'minimize'
        ? { opacity: 0, scale: 0.5, transition: { duration: 0.1, ease: 'easeOut' as const } }
        : { opacity: 0, scale: 0.95, transition: { duration: 0.1, ease: 'easeOut' as const } },
  }

  return (
    <motion.div
      className={wrapperClass}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={drag.handlePointerMove}
      onPointerUp={drag.handlePointerUp}
      onDoubleClick={handleDoubleClick}
      data-testid={`managed-window-${windowId}`}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.12, ease: 'easeOut' }}
    >
      <Window title={windowData.title} active={isActive} glass controls={controls}>
        {children}
      </Window>
    </motion.div>
  )
}
