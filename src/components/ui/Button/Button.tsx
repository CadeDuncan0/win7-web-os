import type { ComponentPropsWithRef } from 'react'

/* 7.css Button
   Doc: https://khang-nd.github.io/7.css/#button
   Renders a native <button> — 7.css applies the full Win7 chrome to the
   element directly. The `default` variant marks this as the form-default
   button (activated on Enter). */
interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: 'default'
  'aria-label': string
  className?: string
}

export function Button({ variant, 'aria-label': ariaLabel, className, ...rest }: ButtonProps) {
  const merged = [variant === 'default' ? 'default' : '', className].filter(Boolean).join(' ')
  return <button className={merged || undefined} aria-label={ariaLabel} {...rest} />
}
