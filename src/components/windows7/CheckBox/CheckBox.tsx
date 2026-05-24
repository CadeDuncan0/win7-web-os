import type { ComponentPropsWithRef } from 'react'

/* 7.css CheckBox
   Doc: https://khang-nd.github.io/7.css/#checkbox
   A native checkbox + label pair. 7.css styles the input chrome (square
   tick box, hover, checked, disabled) directly. The label is always
   bound to the input via for/id so the whole row is clickable. */
interface CheckBoxProps extends Omit<ComponentPropsWithRef<'input'>, 'type'> {
  id: string
  label: string
}

export function CheckBox({ id, label, ...rest }: CheckBoxProps) {
  return (
    <>
      <input type="checkbox" id={id} {...rest} />
      <label htmlFor={id}>{label}</label>
    </>
  )
}
