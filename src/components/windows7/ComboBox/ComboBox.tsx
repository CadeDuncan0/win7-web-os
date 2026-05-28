import type { ComponentPropsWithRef, ReactNode } from 'react'

/* 7.css ComboBox
   Doc: https://khang-nd.github.io/7.css/#combobox
   A text-input + dropdown popover. The input owns the listbox via
   aria-owns; consumers pass <ListBox.Item> JSX children which are
   slotted into the popover <ul role="listbox">. */
interface ComboBoxProps extends ComponentPropsWithRef<'input'> {
  listId: string
  options: ReactNode
}

export function ComboBox({ listId, options, ...inputProps }: ComboBoxProps) {
  return (
    <div className="combobox">
      <input
        type="text"
        role="combobox"
        aria-owns={listId}
        aria-controls={listId}
        aria-expanded={false}
        {...inputProps}
      />
      <button />
      <ul role="listbox" id={listId}>
        {options}
      </ul>
    </div>
  )
}
