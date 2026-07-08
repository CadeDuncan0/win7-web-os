'use client'

import { useRef, useState } from 'react'

import { TASKBAR_RESERVE } from '@/lib/gridMath'
import { clampWindowSize, type Position, type Size } from '@/lib/windowMath'
import { useAppDispatch } from '@/store/hooks'
import { MIN_WINDOW_SIZE, resizeWindow } from '@/store/slices/windowSlice'

interface UseWindowResizeArgs {
  windowId: string
  position: Position
  size: Size
  isMaximized: boolean
}

interface ResizeRef {
  pointerId: number
  startClientX: number
  startClientY: number
}

/**
 * Bottom-right corner resize for a managed window. Mirrors useWindowDrag: the
 * gesture is tracked in local state (sizeOffset) and only committed to Redux on
 * pointer-up, so dragging the handle never thrashes the store or re-renders
 * every window on each pointer move. The window's top-left stays fixed — only
 * the corner moves — so position is left untouched.
 */
export function useWindowResize({ windowId, position, size, isMaximized }: UseWindowResizeArgs) {
  const dispatch = useAppDispatch()
  const [sizeOffset, setSizeOffset] = useState<Size>({ width: 0, height: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef<ResizeRef | null>(null)

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (isMaximized) {
      return
    }
    e.currentTarget.setPointerCapture?.(e.pointerId)
    resizeRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
    }
    setIsResizing(true)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!resizeRef.current || e.pointerId !== resizeRef.current.pointerId) {
      return
    }
    const rawDeltaX = e.clientX - resizeRef.current.startClientX
    const rawDeltaY = e.clientY - resizeRef.current.startClientY
    const candidate = { width: size.width + rawDeltaX, height: size.height + rawDeltaY }
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight - TASKBAR_RESERVE,
    }
    const clamped = clampWindowSize(candidate, position, viewport, MIN_WINDOW_SIZE)
    setSizeOffset({ width: clamped.width - size.width, height: clamped.height - size.height })
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!resizeRef.current || e.pointerId !== resizeRef.current.pointerId) {
      return
    }
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    dispatch(
      resizeWindow({
        id: windowId,
        width: size.width + sizeOffset.width,
        height: size.height + sizeOffset.height,
      })
    )
    resizeRef.current = null
    setIsResizing(false)
    setSizeOffset({ width: 0, height: 0 })
  }

  return {
    sizeOffset,
    isResizing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  }
}
