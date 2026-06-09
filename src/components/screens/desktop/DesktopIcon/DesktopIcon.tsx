'use client'

/** Single draggable desktop icon. Reads its grid position from Redux
 *  and uses @dnd-kit for accessible drag-and-drop with snap-to-grid. */

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import clsx from 'clsx'
import Image from 'next/image'
import type { CSSProperties } from 'react'
import styles from './DesktopIcon.module.css'
import { gridCellToPixels } from '@/lib/gridMath'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectIconById, selectSelectedIconId, setSelectedIcon } from '@/store/slices/desktopSlice'

interface DesktopIconProps {
  id: string
  label: string
  iconSrc: string
  onOpen: () => void
}

export function DesktopIcon({ id, label, iconSrc, onOpen }: DesktopIconProps) {
  const dispatch = useAppDispatch()
  const icon = useAppSelector(selectIconById(id))
  const selectedIconId = useAppSelector(selectSelectedIconId)
  const isSelected = selectedIconId === id

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })

  const position = icon ? gridCellToPixels(icon.position) : { x: 0, y: 0 }

  // CSS.Translate (not CSS.Transform) — we only need translation, no scale/rotate
  const style: CSSProperties = {
    position: 'absolute',
    left: position.x,
    top: position.y,
    width: 'var(--dsk-grid-cell-w)',
    height: 'var(--dsk-grid-cell-h)',
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 100 : 1, // Float above other icons while dragging
  }

  return (
    <button
      ref={setNodeRef}
      className={clsx(styles.icon, isSelected && styles.selected)}
      style={style}
      onClick={() => {
        if (icon) {
          dispatch(setSelectedIcon(icon))
        }
      }}
      onDoubleClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onOpen()
        }
      }}
      aria-label={label}
      {...attributes}
      {...listeners}
    >
      <Image
        className={styles.image}
        src={iconSrc}
        alt="" // Decorative — accessible name comes from the button's aria-label
        draggable={false}
        width={64}
        height={64}
      />
      <span className={styles.label}>{label}</span>
    </button>
  )
}
