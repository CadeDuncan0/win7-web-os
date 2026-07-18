import { useState, type ReactNode } from 'react'

/* 7.css Tabs
   Doc: https://khang-nd.github.io/7.css/#tabs
   Renders a <section class="tabs"> with a tablist <menu> and one
   <article role="tabpanel"> per item. Controlled mode is exposed via
   `value`/`onChange`; otherwise the first tab is selected by default. */
interface TabItem {
  id: string
  label: string
  content: ReactNode
}

interface TabsProps {
  items: TabItem[]
  ariaLabel?: string
  value?: string
  onChange?: (id: string) => void
  style?: React.CSSProperties
  className?: string
}

export function Tabs({ items, ariaLabel, value, onChange, style, className }: TabsProps) {
  const [internal, setInternal] = useState(items[0]?.id ?? '')
  const active = value ?? internal
  const select = (id: string) => {
    if (onChange) {
      onChange(id)
    } else {
      setInternal(id)
    }
  }

  const merged = ['tabs', className].filter(Boolean).join(' ')

  return (
    <section className={merged} style={style}>
      <menu role="tablist" aria-label={ariaLabel}>
        {items.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-controls={item.id}
            aria-selected={item.id === active}
            onClick={() => select(item.id)}
          >
            {item.label}
          </button>
        ))}
      </menu>
      {items.map((item) => (
        <article key={item.id} role="tabpanel" id={item.id} hidden={item.id !== active}>
          {item.content}
        </article>
      ))}
    </section>
  )
}
