import type { ComponentPropsWithRef } from 'react'

/* 7.css OptionButton (radio)
   Doc: https://khang-nd.github.io/7.css/#optionbutton
   Native radio input + label pair. Group multiple OptionButtons by
   passing the same `name` to each. 7.css renders the radio dot and
   focus ring directly on the input. */
interface OptionButtonProps extends Omit<ComponentPropsWithRef<'input'>, 'type'> {
  id: string
  label: string
  name: string
}

export function OptionButton({ id, label, name, ...rest }: OptionButtonProps) {
  return (
    <>
      <input type="radio" id={id} name={name} {...rest} />
      <label htmlFor={id}>{label}</label>
    </>
  )
}
