import type { ComponentPropsWithRef, ReactNode } from 'react'

/* 7.css ListBox
   Doc: https://khang-nd.github.io/7.css/#listbox
   Two patterns:
   - `<select multiple>` for native form controls (use Dropdown w/ `multiple`)
   - `<ul role="listbox">` for richer custom items
   This component implements the latter — pass <ListBox.Item> children. */
interface ListBoxProps extends ComponentPropsWithRef<'ul'> {
  shadow?: boolean
  hover?: boolean
  children: ReactNode
}

interface ListBoxItemProps extends ComponentPropsWithRef<'li'> {
  selected?: boolean
}

export function ListBox({
  shadow = true,
  hover = true,
  className,
  children,
  ...rest
}: ListBoxProps) {
  const merged = [shadow && 'has-shadow', hover && 'has-hover', className].filter(Boolean).join(' ')
  return (
    <ul role="listbox" className={merged || undefined} {...rest}>
      {children}
    </ul>
  )
}

function Item({ selected, className, children, ...rest }: ListBoxItemProps) {
  const merged = [selected && 'is-selected', className].filter(Boolean).join(' ')
  return (
    <li role="option" aria-selected={selected} className={merged || undefined} {...rest}>
      {children}
    </li>
  )
}

ListBox.Item = Item
