import type { ComponentPropsWithRef, ReactNode } from 'react'

/* 7.css GroupBox
   Doc: https://khang-nd.github.io/7.css/#groupbox
   Standard <fieldset> + <legend>. 7.css applies a Win7 inset border
   around the fieldset and renders the legend as the label notch. */
interface GroupBoxProps extends ComponentPropsWithRef<'fieldset'> {
  legend: ReactNode
}

export function GroupBox({ legend, children, ...rest }: GroupBoxProps) {
  return (
    <fieldset {...rest}>
      <legend>{legend}</legend>
      {children}
    </fieldset>
  )
}
