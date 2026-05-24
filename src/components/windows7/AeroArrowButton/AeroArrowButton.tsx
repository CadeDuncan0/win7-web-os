'use client'

import type { ComponentPropsWithRef } from 'react'

/* AeroArrowButton — Win7 lockscreen circular submit.
   Mirrors the .logon__form-submit button from
   public/copycats/signin/signin.htm: a circular blue-arrow control that
   absolute-positions to the right of the password column at
   top:calc(50% - 16px). Chrome lives in globals.css under
   .logon__form-submit so the same gradient + halo box-shadow used by
   the text buttons applies here unchanged. */
interface AeroArrowButtonProps extends ComponentPropsWithRef<'button'> {
  direction?: 'left' | 'right'
}

export function AeroArrowButton({
  direction = 'right',
  className,
  type = 'button',
  ...rest
}: AeroArrowButtonProps) {
  const merged = ['logon__form-submit', className].filter(Boolean).join(' ')
  return (
    <button type={type} {...rest} className={merged}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 10 10"
        aria-hidden="true"
        style={direction === 'left' ? { transform: 'scaleX(-1)' } : undefined}
      >
        <polyline
          points="3,2 7,5 3,8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
