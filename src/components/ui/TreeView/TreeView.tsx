import type { ComponentPropsWithRef, ReactNode } from 'react'

/* 7.css TreeView
   Doc: https://khang-nd.github.io/7.css/#treeview
   A <ul class="tree-view"> wrapper. Optional decorations are exposed
   as boolean props that map to the corresponding 7.css class modifiers:
   - `container`        → has-container (boxed surround)
   - `collapseButtons`  → has-collapse-button (chevrons on <details>)
   - `connectors`       → has-connector (vertical guide lines)
   Children compose freely — leaf items are plain <li>; expandable
   groups use <details><summary>…</summary><ul>…</ul></details>. */
interface TreeViewProps extends ComponentPropsWithRef<'ul'> {
  container?: boolean
  collapseButtons?: boolean
  connectors?: boolean
  children: ReactNode
}

export function TreeView({
  container,
  collapseButtons,
  connectors,
  className,
  children,
  ...rest
}: TreeViewProps) {
  const merged = [
    'tree-view',
    container && 'has-container',
    collapseButtons && 'has-collapse-button',
    connectors && 'has-connector',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <ul className={merged} {...rest}>
      {children}
    </ul>
  )
}
