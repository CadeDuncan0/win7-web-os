'use client'

import { useRef, useState } from 'react'

import { TASKBAR_RESERVE } from '@/lib/gridMath'
import { clampWindowPosition, type Position, type Size } from '@/lib/windowMath'
import { useAppDispatch } from '@/store/hooks'
import { moveWindow } from '@/store/slices/windowSlice'

interface UseWindowDragArgs {
  windowId: string
  position: Position
  size: Size
  isMaximized: boolean
}

interface DragRef {
  pointerId: number
  startClientX: number
  startClientY: number
}

export function useWindowDrag({ windowId, position, size, isMaximized }: UseWindowDragArgs) {
  const dispatch = useAppDispatch()
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<DragRef | null>(null)

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (isMaximized) {
      return
    }
    if (!(e.target as Element).closest('.title-bar')) {
      return
    }
    if ((e.target as Element).closest('.title-bar-controls')) {
      return
    }
    // The optional title-bar toolbar row (browser nav/address bar) is interactive
    // chrome, not a drag handle, even though it lives inside the title bar.
    if ((e.target as Element).closest('.title-bar-toolbar')) {
      return
    }
    e.currentTarget.setPointerCapture?.(e.pointerId)
    dragRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
    }
    setIsDragging(true)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current || e.pointerId !== dragRef.current.pointerId) {
      return
    }
    const rawOffsetX = e.clientX - dragRef.current.startClientX
    const rawOffsetY = e.clientY - dragRef.current.startClientY
    const candidate = { x: position.x + rawOffsetX, y: position.y + rawOffsetY }
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight - TASKBAR_RESERVE,
    }
    const clamped = clampWindowPosition(candidate, size, viewport)
    setDragOffset({ x: clamped.x - position.x, y: clamped.y - position.y })
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current || e.pointerId !== dragRef.current.pointerId) {
      return
    }
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    dispatch(
      moveWindow({
        id: windowId,
        x: position.x + dragOffset.x,
        y: position.y + dragOffset.y,
      })
    )
    dragRef.current = null
    setIsDragging(false)
    setDragOffset({ x: 0, y: 0 })
  }

  return {
    dragOffset,
    isDragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  }
}
