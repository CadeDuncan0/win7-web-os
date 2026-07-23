import type { ComponentPropsWithRef, ReactNode } from 'react'

/* 7.css Collapse
   Doc: https://khang-nd.github.io/7.css/#collapse
   Native <details>/<summary> for expand-and-reveal. 7.css styles the
   chevron and indentation. `open` controls the initial state. */
interface CollapseProps extends ComponentPropsWithRef<'details'> {
  summary: ReactNode
  children: ReactNode
}

export function Collapse({ summary, children, ...rest }: CollapseProps) {
  return (
    <details {...rest}>
      <summary>{summary}</summary>
      {children}
    </details>
  )
}
