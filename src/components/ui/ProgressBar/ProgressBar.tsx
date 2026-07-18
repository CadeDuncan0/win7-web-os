import type { ComponentPropsWithRef } from 'react'

/* 7.css ProgressBar
   Doc: https://khang-nd.github.io/7.css/#progressbar
   Three modes:
   - determinate     → pass `value` (0-100); inner bar is sized by width
   - paused          → `paused` flag; bar held at `value`
   - indeterminate   → `marquee` flag; ignores `value`, animates fill */
interface ProgressBarProps extends Omit<ComponentPropsWithRef<'div'>, 'role'> {
  value?: number
  paused?: boolean
  marquee?: boolean
}

export function ProgressBar({ value = 0, paused, marquee, className, ...rest }: ProgressBarProps) {
  const merged = [paused && 'paused', marquee && 'marquee', className].filter(Boolean).join(' ')
  return (
    <div
      role="progressbar"
      aria-valuemin={marquee ? undefined : 0}
      aria-valuemax={marquee ? undefined : 100}
      aria-valuenow={marquee ? undefined : value}
      className={merged || undefined}
      {...rest}
    >
      {!marquee && <div style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />}
    </div>
  )
}
