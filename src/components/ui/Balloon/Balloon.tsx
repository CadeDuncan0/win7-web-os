import type { ComponentPropsWithRef, ReactNode } from 'react'

/* 7.css Balloon / Tooltip
   Doc: https://khang-nd.github.io/7.css/#balloon
   A floating callout. Position the tail with `position` (top/bottom +
   left/right). When `targetId` is provided, the balloon is configured
   as an aria-describedby target (use the same id on the input). */
type Vertical = 'top' | 'bottom'
type Horizontal = 'left' | 'right'

interface BalloonProps extends Omit<ComponentPropsWithRef<'div'>, 'role'> {
  position?: `${Vertical}-${Horizontal}` | Vertical | Horizontal
  children: ReactNode
}

export function Balloon({ position, className, children, ...rest }: BalloonProps) {
  const positionClasses = position
    ? position
        .split('-')
        .map((p) => `is-${p}`)
        .join(' ')
    : ''
  const merged = [positionClasses, className].filter(Boolean).join(' ')
  return (
    <div role="tooltip" className={merged || undefined} {...rest}>
      {children}
    </div>
  )
}
