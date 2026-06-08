'use client'

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

export function DesktopIcon({
  id: _id,
  label: _label,
  iconSrc: _iconSrc,
  onOpen: _onOpen,
}: DesktopIconProps) {
  const dispatch = useAppDispatch()
  //   1. Read icon state from Redux via selectIconById(id) and selectSelectedIconId.
  //      Derive isSelected from selectedIconId === id.
  const icon = useAppSelector(selectIconById(_id))!
  const selectedIconId = useAppSelector(selectSelectedIconId)
  const isSelected = selectedIconId === _id

  //   2. Wire @dnd-kit draggable via useDraggable({ id }).
  //      Destructure: attributes, listeners, setNodeRef, transform, isDragging.
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable(icon)

  //   3. Compute pixel position from icon.position via gridCellToPixels.
  //      Fallback to { x: 0, y: 0 } if icon is undefined.
  const pixelPosition = gridCellToPixels(icon.position ?? { x: 0, y: 0 })

  //   4. Build inline style (CSSProperties):
  //      - position: 'absolute', left/top from pixel position
  //      - width/height from CSS vars (--dsk-grid-cell-w, --dsk-grid-cell-h)
  //      - transform via CSS.Translate.toString(transform) during drag
  //      - opacity: 0.6 while dragging, 1 otherwise
  //      - zIndex: 100 while dragging, 1 otherwise
  const style: CSSProperties = {
    position: 'absolute',
    width: 'var(--dsk-grid-cell-w)',
    height: 'var(--dsk-grid-cell-h)',
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 100 : 1,
    x: pixelPosition.x,
    y: pixelPosition.y,
  }

  //   5. Render a <button> with:
  //      - ref={setNodeRef}
  //      - className via clsx(styles.icon, isSelected && styles.selected)
  //      - style from step 4 nm
  //      - onClick → dispatch setSelectedIcon
  //      - onDoubleClick → onOpen
  //      - onKeyDown → if Enter, call onOpen (keyboard activation)
  //      - aria-label={label}
  //      - spread ...attributes and ...listeners from useDraggable
  const className = clsx(styles.icon, isSelected && styles.selected)
  return (
    <button
      ref={setNodeRef}
      className={className}
      style={style}
      onClick={() => dispatch(setSelectedIcon(icon))}
      onDoubleClick={() => _onOpen()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          _onOpen()
        }
      }}
      aria-label={_label}
      draggable={isDragging}
      {...attributes}
      {...listeners}
    >
      <Image
        className={styles.image}
        src={_iconSrc}
        alt=""
        draggable={false}
        width={64}
        height={64}
      />
      <span className={styles.label}>{_label}</span>
    </button>
  )
}
