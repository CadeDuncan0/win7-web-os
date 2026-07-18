import type { ComponentPropsWithRef } from 'react'

/* 7.css Dropdown
   Doc: https://khang-nd.github.io/7.css/#dropdown
   Native <select>. 7.css restyles the closed control with Win7 chrome;
   the open menu uses the browser's native picker. */
type DropdownProps = ComponentPropsWithRef<'select'>

export function Dropdown(props: DropdownProps) {
  return <select {...props} />
}
