'use client'

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
import { useDraggable } from '@dnd-kit/core'
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
import { CSS } from '@dnd-kit/utilities'
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
import clsx from 'clsx'
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
import type { CSSProperties } from 'react'

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
import { gridCellToPixels } from '@/lib/gridMath'
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
import { useAppDispatch, useAppSelector } from '@/store/hooks'
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
import { selectIconById, selectSelectedIconId, setSelectedIcon } from '@/store/slices/desktopSlice'

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
import styles from './DesktopIcon.module.css'

interface DesktopIconProps {
  id: string
  label: string
  iconSrc: string
  onOpen: () => void
}

// TODO: [Action Required: implement the DesktopIcon component] - 25 min
//
//   1. Read icon state from Redux via selectIconById(id) and selectSelectedIconId.
//      Derive isSelected from selectedIconId === id.
//
//   2. Wire @dnd-kit draggable via useDraggable({ id }).
//      Destructure: attributes, listeners, setNodeRef, transform, isDragging.
//
//   3. Compute pixel position from icon.position via gridCellToPixels.
//      Fallback to { x: 0, y: 0 } if icon is undefined.
//
//   4. Build inline style (CSSProperties):
//      - position: 'absolute', left/top from pixel position
//      - width/height from CSS vars (--dsk-grid-cell-w, --dsk-grid-cell-h)
//      - transform via CSS.Translate.toString(transform) during drag
//      - opacity: 0.6 while dragging, 1 otherwise
//      - zIndex: 100 while dragging, 1 otherwise
//
//   5. Render a <button> with:
//      - ref={setNodeRef}
//      - className via clsx(styles.icon, isSelected && styles.selected)
//      - style from step 4
//      - onClick → dispatch setSelectedIcon
//      - onDoubleClick → onOpen
//      - onKeyDown → if Enter, call onOpen (keyboard activation)
//      - aria-label={label}
//      - spread ...attributes and ...listeners from useDraggable
//
//   6. Inside the button:
//      - <img className={styles.image} src={iconSrc} alt="" draggable={false} />
//      - <span className={styles.label}>{label}</span>
export function DesktopIcon({
  id: _id,
  label: _label,
  iconSrc: _iconSrc,
  onOpen: _onOpen,
}: DesktopIconProps) {
  throw new Error('Not implemented')
}
