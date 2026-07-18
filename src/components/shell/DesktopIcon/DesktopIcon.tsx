'use client'

/** Single draggable desktop icon. Reads its grid position from Redux
 *  and uses @dnd-kit for accessible drag-and-drop with snap-to-grid. */

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import clsx from 'clsx'
import Image from 'next/image'
import type { CSSProperties } from 'react'
import styles from './DesktopIcon.module.css'
import { withBasePath } from '@/lib/assetPaths'
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

  // Dragging is pointer-only (no KeyboardSensor), so drop dnd-kit's
  // keyboard-drag announcements — aria-roledescription="draggable" and the
  // aria-describedby pointing at "press space/enter to pick up" instructions.
  const {
    'aria-roledescription': _ariaRoleDescription,
    'aria-describedby': _ariaDescribedBy,
    ...iconAttributes
  } = attributes

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
      onClick={() => dispatch(setSelectedIcon({ id }))}
      onDoubleClick={onOpen}
      aria-label={label}
      {...iconAttributes}
      {...listeners}
      // Enter opens the selected icon (authentic Win7: select, then Enter).
      // Dragging is pointer-only — there is no KeyboardSensor — so there is
      // no sensor onKeyDown to compose with here.
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onOpen()
        }
      }}
    >
      {/* The image optimizer resolves its url param against the domain root,
          so the subpath prefix must be baked into the src by hand. */}
      <Image
        className={styles.image}
        src={withBasePath(iconSrc)}
        alt="" // Decorative — accessible name comes from the button's aria-label
        draggable={false}
        width={64}
        height={64}
      />
      <span className={styles.label}>{label}</span>
    </button>
  )
}
