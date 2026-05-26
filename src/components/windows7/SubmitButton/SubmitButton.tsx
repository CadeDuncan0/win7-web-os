'use client'

import type { ComponentPropsWithRef } from 'react'

export function SubmitButton({
  className,
  type = 'button',
  ...rest
}: ComponentPropsWithRef<'button'>) {
  const merged = ['signin__form-submit', className].filter(Boolean).join(' ')
  return (
    <button type={type} {...rest} className={merged}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="17"
        viewBox="0 0 18 17"
        aria-hidden="true"
      >
        <path
          fill="#fff"
          d="M 9.56 16.50 L 9.11 16.45 L 8.78 16.28 L 7.66 15.15 L 7.50 14.56 L 7.58 13.02 L 9.33 11.16 L 9.38 10.97 L 9.22 10.72 L 8.56 10.50 L 2.11 10.45 L 1.78 10.28 L 0.72 9.22 L 0.50 8.56 L 0.55 8.11 L 0.72 7.78 L 1.78 6.72 L 2.11 6.55 L 8.56 6.50 L 9.22 6.28 L 9.36 6.09 L 9.33 5.84 L 7.58 3.98 L 7.50 2.44 L 7.72 1.78 L 8.85 0.66 L 9.44 0.50 L 9.89 0.55 L 10.22 0.72 L 17.28 7.78 L 17.50 8.44 L 17.45 8.89 L 17.28 9.22 L 10.00 16.50 Z"
        />
      </svg>
    </button>
  )
}
