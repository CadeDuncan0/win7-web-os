import type { ComponentPropsWithRef } from 'react'

/* 7.css SearchBox
   Doc: https://khang-nd.github.io/7.css/#searchbox
   Two variants:
   - bare <input type="search"> — standalone field with magnifier glyph
   - wrapped div.searchbox with explicit <button> — adds a clickable
     search affordance, useful when the action is a submit. */
interface SearchBoxProps extends Omit<ComponentPropsWithRef<'input'>, 'type'> {
  withButton?: boolean
  onSearch?: () => void
}

export function SearchBox({ withButton, onSearch, ...rest }: SearchBoxProps) {
  if (!withButton) {
    return <input type="search" {...rest} />
  }
  return (
    <div className="searchbox">
      <input type="search" {...rest} />
      <button aria-label="search" onClick={onSearch} />
    </div>
  )
}
