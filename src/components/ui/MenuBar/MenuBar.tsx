import type { ComponentPropsWithRef, ReactNode } from 'react'

/* 7.css MenuBar
   Doc: https://khang-nd.github.io/7.css/#menubar
   The horizontal menu strip across the top of a window (File / Edit /
   View / Help). <ul role="menubar"> with <li role="menuitem"> children. */
interface MenuBarProps extends ComponentPropsWithRef<'ul'> {
  children: ReactNode
}

interface MenuBarItemProps extends ComponentPropsWithRef<'li'> {
  children: ReactNode
}

export function MenuBar({ children, ...rest }: MenuBarProps) {
  return (
    <ul role="menubar" {...rest}>
      {children}
    </ul>
  )
}

function Item({ children, ...rest }: MenuBarItemProps) {
  return (
    <li role="menuitem" tabIndex={0} {...rest}>
      {children}
    </li>
  )
}

MenuBar.Item = Item
