import type { ComponentPropsWithRef, ReactNode } from 'react'

/* 7.css Scrollbar
   Doc: https://khang-nd.github.io/7.css/#scrollbar
   7.css restyles native scrollbars automatically wherever content
   overflows. This component is a thin overflow-container helper:
   pass a fixed size and tall children to demonstrate the Win7
   scroll thumbs and arrow buttons. */
interface ScrollbarProps extends ComponentPropsWithRef<'div'> {
  children: ReactNode
}

export function Scrollbar({ style, children, ...rest }: ScrollbarProps) {
  return (
    <div style={{ overflow: 'auto', ...style }} {...rest}>
      {children}
    </div>
  )
}
