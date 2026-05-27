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
  const buttonClass = [styles.button, disabled ? '' : styles.canClick, className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.wrapper}>
      <button
        className={buttonClass}
        data-test-avatar="win7"
        type="button"
        disabled={disabled}
        onClick={onClick}
      >
        <span className={styles.mask}>
          <Image
            src={iconSrc ?? '/imgs/windows7/user-icons/guest.bmp'}
            alt="User avatar"
            className={styles.image}
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
