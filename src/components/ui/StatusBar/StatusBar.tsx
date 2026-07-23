import type { ComponentPropsWithRef } from 'react'

/* 7.css Status Bar
   Doc: https://khang-nd.github.io/7.css/#window (Status Bar subsection)
   A div.status-bar containing one or more p.status-bar-field cells. */
type StatusBarProps = ComponentPropsWithRef<'div'>
type StatusBarFieldProps = ComponentPropsWithRef<'p'>

export function StatusBar({ className, children, ...rest }: StatusBarProps) {
  const merged = ['status-bar', className].filter(Boolean).join(' ')
  return (
    <div className={merged} {...rest}>
      {children}
    </div>
  )
}

function Field({ className, children, ...rest }: StatusBarFieldProps) {
  const merged = ['status-bar-field', className].filter(Boolean).join(' ')
  return (
    <p className={merged} {...rest}>
      {children}
    </p>
  )
}

StatusBar.Field = Field
