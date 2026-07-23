'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'

import styles from './ContextMenu.module.css'
import { Menu } from '@/components/ui/Menu'

/** Reusable right-click menu — a general OS affordance any surface can attach
 *  (desktop background, taskbar buttons, future apps). Wraps the windows7
 *  `Menu` primitive with anchored positioning, outside-click + Escape
 *  dismissal, and viewport edge flip. All menu chrome (surface, rows, hover,
 *  submenu chevron, checkbox) is drawn by 7.css. The owner controls mounting:
 *  render it with the right-click coordinates, unmount on `onClose`. */

export interface ContextMenuItem {
  label: string
  onSelect?: () => void
  disabled?: boolean
  /** Renders a 7.css menu checkbox reflecting this state (e.g. the Show icons
   *  visibility toggles). */
  checked?: boolean
  /** Hover-opened flyout items. A submenu parent has no onSelect of its own —
   *  it exists to reveal its children (7.css draws the ► chevron). */
  submenu?: ContextMenuItem[]
}

export interface ContextMenuProps {
  items: ContextMenuItem[]
  /** Anchor point in viewport coordinates (the right-click's clientX/Y). */
  position: { x: number; y: number }
  onClose: () => void
  ariaLabel?: string
}

export function ContextMenu({ items, position, onClose, ariaLabel }: ContextMenuProps) {
  const menuRef = useRef<HTMLUListElement>(null)
  const baseId = useId()
  // null until the first measurement — the menu renders hidden at the raw
  // anchor for one layout pass so its size is known before it is placed.
  const [placed, setPlaced] = useState<{ x: number; y: number } | null>(null)

  // Viewport edge flip: a menu that would overflow the right/bottom edge opens
  // to the left of / above the anchor instead (Win7 behavior), clamped to 0.
  useLayoutEffect(() => {
    const rect = menuRef.current?.getBoundingClientRect()
    if (!rect) {
      return
    }
    setPlaced({
      x:
        position.x + rect.width > window.innerWidth
          ? Math.max(0, position.x - rect.width)
          : position.x,
      y:
        position.y + rect.height > window.innerHeight
          ? Math.max(0, position.y - rect.height)
          : position.y,
    })
  }, [position])

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const style: CSSProperties = placed
    ? { left: placed.x, top: placed.y }
    : { left: position.x, top: position.y, visibility: 'hidden' }

  function renderItem(item: ContextMenuItem) {
    // Submenu parent: text sits directly in the <li>, which 7.css turns into the
    // row and marks with the ► chevron. `.can-hover` on the root opens it.
    if (item.submenu) {
      return (
        <Menu.Item key={item.label} disabled={item.disabled} aria-haspopup="true">
          {item.label}
          <Menu>{item.submenu.map(renderItem)}</Menu>
        </Menu.Item>
      )
    }

    // Checkable row: 7.css's native menu checkbox — the input is hidden and its
    // label carries the row, box, and ✔. Clicking the label toggles the input.
    if (item.checked !== undefined) {
      const id = `${baseId}-${item.label.replace(/\s+/g, '-')}`
      return (
        <Menu.Item key={item.label} disabled={item.disabled}>
          <input
            type="checkbox"
            id={id}
            checked={item.checked}
            disabled={item.disabled}
            onChange={() => {
              item.onSelect?.()
              onClose()
            }}
          />
          <label htmlFor={id}>{item.label}</label>
        </Menu.Item>
      )
    }

    return (
      <Menu.Item key={item.label} disabled={item.disabled}>
        <button
          type="button"
          disabled={item.disabled}
          onClick={() => {
            item.onSelect?.()
            onClose()
          }}
        >
          {item.label}
        </button>
      </Menu.Item>
    )
  }

  return (
    <Menu ref={menuRef} className={`${styles.menu} can-hover`} style={style} aria-label={ariaLabel}>
      {items.map(renderItem)}
    </Menu>
  )
}
