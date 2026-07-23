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
  /** App icon rendered to the left of the title text (authentic Win7 chrome). */
  icon?: ReactNode
  controls?: ReactNode
  /**
   * Optional second title-bar row (e.g. a browser nav/address toolbar). When
   * present the title bar stacks into two rows so the toolbar reads as part of
   * the window's glass top border rather than the body.
   */
  toolbar?: ReactNode
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
  icon,
  controls,
  toolbar,
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

  const titleText = (title || icon) && (
    <div className="title-bar-text" id={ariaLabelledby}>
      {icon && <span className="title-bar-icon">{icon}</span>}
      {title}
    </div>
  )

  return (
    <div
      className={merged}
      style={style}
      id={id}
      role={role}
      aria-labelledby={ariaLabelledby}
      aria-label={ariaLabel}
    >
      {(title || icon || controls) &&
        (toolbar ? (
          // Two-row title bar: standard row + a toolbar row, both inside the
          // glass top border. `title-bar-main` re-creates the default
          // space-between row that 7.css applies to `.title-bar` directly.
          <div className="title-bar has-titlebar-toolbar">
            <div className="title-bar-main">
              {titleText}
              {controls && <div className="title-bar-controls">{controls}</div>}
            </div>
            <div className="title-bar-toolbar">{toolbar}</div>
          </div>
        ) : (
          <div className="title-bar">
            {titleText}
            {controls && <div className="title-bar-controls">{controls}</div>}
          </div>
        ))}
      <div className={bodyClass}>{children}</div>
      {statusBar}
    </div>
  )
}
