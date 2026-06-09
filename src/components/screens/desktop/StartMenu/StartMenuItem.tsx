'use client'

import styles from './StartMenuItem.module.css'

/** Single shortcut row used in both Start Menu columns.
 *  Follows WAI-ARIA menuitem pattern: focus is managed by the parent
 *  menu via roving tabindex, not by the browser tab order. */

interface StartMenuItemProps {
  iconSrc: string
  label: string
  onClick: () => void
}

export function StartMenuItem({ iconSrc, label, onClick }: StartMenuItemProps) {
  return (
    <li
      role="menuitem"
      tabIndex={-1} // Roving tabindex — parent menu controls focus programmatically
      className={styles.item}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.itemIcon}
        src={iconSrc}
        alt="" // Decorative — accessible name comes from the menuitem's label text
        width={24}
        height={24}
        draggable={false}
      />
      <span className={styles.itemLabel}>{label}</span>
    </li>
  )
}
