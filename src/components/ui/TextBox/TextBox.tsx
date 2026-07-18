import type { ComponentPropsWithRef } from 'react'

/* 7.css TextBox
   Doc: https://khang-nd.github.io/7.css/#textbox
   Bare <input> / <textarea> — 7.css styles the elements directly with
   border, focus ring, and disabled state. Pass `multiline` to render a
   textarea. The `type` prop forwards the standard input types (text,
   password, email, etc.); 7.css's chrome applies to all of them. */
type InputType = 'text' | 'password' | 'email' | 'tel' | 'url' | 'number'

interface SingleLineProps extends Omit<ComponentPropsWithRef<'input'>, 'type'> {
  multiline?: false
  type?: InputType
}

interface MultilineProps extends ComponentPropsWithRef<'textarea'> {
  multiline: true
}

type TextBoxProps = SingleLineProps | MultilineProps

export function TextBox(props: TextBoxProps) {
  if (props.multiline) {
    const { multiline: _m, rows = 4, ...rest } = props
    return <textarea rows={rows} {...rest} />
  }
  const { multiline: _m, type = 'text', ...rest } = props
  return <input type={type} {...rest} />
}
