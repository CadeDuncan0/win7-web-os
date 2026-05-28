import type { ComponentPropsWithRef } from 'react'

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
  const merged = [base, className].filter(Boolean).join(' ')
  return <span className={merged} {...rest} />
}
