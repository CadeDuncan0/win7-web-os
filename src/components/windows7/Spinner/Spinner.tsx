import type { ComponentPropsWithRef } from 'react'

import styles from './Spinner.module.css'

/* 7.css Spinner / Loader
   Doc: https://khang-nd.github.io/7.css/#spinner
   Three variants:
   - `spinner`  → rotating cursor-style indicator (indeterminate work)
   - `loader`   → static "loading" stripe
   - `loading`  → animated "loading" stripe (marquee) */
type SpinnerVariant = 'spinner' | 'loader' | 'loading'

interface SpinnerProps extends ComponentPropsWithRef<'span'> {
  variant?: SpinnerVariant
}

export function Spinner({ variant = 'spinner', className, ...rest }: SpinnerProps) {
  const base =
    variant === 'spinner' ? 'spinner' : variant === 'loader' ? 'loader' : 'loader animate'
  /* The `loading` variant's motion is a GIF; swap 7.css's clamped-speed
     GIF for our faster re-encode (see Spinner.module.css). */
  const fast = variant === 'loading' ? styles.fast : null
  const merged = [base, fast, className].filter(Boolean).join(' ')
  return <span className={merged} {...rest} />
}
