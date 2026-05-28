import type { CSSProperties, ReactNode } from 'react'

/* 7.css Window
   Doc: https://khang-nd.github.io/7.css/#window
   Includes the three nested concerns the spec groups under Window:
   - Title Bar (text + controls)
   - Window body (with optional has-space inset)
   - Glass frame variant (`glass` flag)
   - Dialog variant (set `role="dialog"` + `ariaLabelledby`)

   Status Bar is exposed as a sibling slot so consumers can opt in. */
interface WindowProps {
  title?: ReactNode
  active?: boolean
  glass?: boolean
  bright?: boolean
  bodySpace?: boolean
  controls?: ReactNode
  statusBar?: ReactNode
  children?: ReactNode
  role?: string
  className?: string
  style?: CSSProperties
  id?: string
  'aria-labelledby'?: string
  'aria-label'?: string
}

export function Window({
  title,
  active = true,
  glass,
  bright,
  bodySpace = true,
  controls,
  statusBar,
  children,
  role,
  className,
  style,
  id,
  'aria-labelledby': ariaLabelledby,
  'aria-label': ariaLabel,
}: WindowProps) {
  const merged = ['window', active && 'active', glass && 'glass', bright && 'is-bright', className]
    .filter(Boolean)
    .join(' ')

  const bodyClass = ['window-body', bodySpace && 'has-space'].filter(Boolean).join(' ')

  return (
    <div
      className={merged}
      style={style}
      id={id}
      role={role}
      aria-labelledby={ariaLabelledby}
      aria-label={ariaLabel}
    >
      {(title || controls) && (
        <div className="title-bar">
          {title && (
            <div className="title-bar-text" id={ariaLabelledby}>
              {title}
            </div>
          )}
          {controls && <div className="title-bar-controls">{controls}</div>}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
      {statusBar}
    </div>
  )
}
