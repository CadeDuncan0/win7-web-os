'use client'

import Image from 'next/image'
import styles from './AccountIcon.module.css'

interface AccountIconProps {
  className?: string
  iconSrc?: string
  subtitle?: string
  width?: number
  height?: number
  disabled?: boolean
  onClick?: () => void
}

export function AccountIcon({
  className,
  iconSrc,
  subtitle,
  width = 128,
  height = 128,
  disabled,
  onClick,
}: AccountIconProps) {
  return (
    <div className={styles.wrapper}>
      {/*
       * avatar-button  — globals.css: white background, 23px frame padding,
       *                  drop-shadow filter, hover/focus glow
       * can-click      — globals.css: enables cyan glow on hover/focus
       * styles.avatarButton — module: adds position:relative + ::after overlay
       *                       that renders --avatar-frame (accountIconBorder.png)
       */}
      <button
        className={`avatar-button avatar-frame ${disabled ? '' : 'can-click'} ${styles.avatarButton}${className ? ` ${className}` : ''}`}
        data-test-avatar="win7"
        type="button"
        disabled={disabled}
        onClick={onClick}
      >
        {/* avatar-mask  — globals.css: 98×98 container + gloss ::after */}
        <span className="avatar-mask">
          {/* avatar-image — globals.css: fills mask, object-fit cover, inner border */}
          <Image
            src={iconSrc ?? '/imgs/windows7/user-icons/guest.bmp'}
            alt="User avatar"
            className="avatar-image"
            width={width}
            height={height}
            unoptimized
          />
        </span>
      </button>

      {subtitle !== undefined && <span className={styles.subtitle}>{subtitle}</span>}
    </div>
  )
}
