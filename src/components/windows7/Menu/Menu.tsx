import type { ComponentPropsWithRef, ReactNode } from 'react'

/* 7.css Menu
   Doc: https://khang-nd.github.io/7.css/#menu
   A floating context menu — <ul role="menu"> with <li role="menuitem">
   children. 7.css applies the Win7 menu chrome (chevron submenu hint,
   keyboard underline, disabled state). */
interface MenuProps extends ComponentPropsWithRef<'ul'> {
  children: ReactNode
}

interface MenuItemProps extends ComponentPropsWithRef<'li'> {
  disabled?: boolean
  children: ReactNode
}

export function Menu({ children, ...rest }: MenuProps) {
  return (
    <ul role="menu" {...rest}>
      {children}
    </ul>
  )
}

function Item({ disabled, className, children, ...rest }: MenuItemProps) {
  const merged = [disabled && 'is-disabled', className].filter(Boolean).join(' ')
  return (
    <li role="menuitem" tabIndex={disabled ? -1 : 0} className={merged || undefined} {...rest}>
      {children}
    </li>
  )
}

Menu.Item = Item
