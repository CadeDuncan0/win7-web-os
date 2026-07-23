import type { ComponentPropsWithRef } from 'react'

/* 7.css Slider
   Doc: https://khang-nd.github.io/7.css/#slider
   Native <input type="range">. Two visual options:
   - `vertical`         → wraps in a div.is-vertical for vertical orientation
   - `boxIndicator`     → swaps the thumb for a Win7 boxed indicator */
interface SliderProps extends Omit<ComponentPropsWithRef<'input'>, 'type'> {
  vertical?: boolean
  boxIndicator?: boolean
}

export function Slider({ vertical, boxIndicator, className, ...rest }: SliderProps) {
  const merged = [boxIndicator && 'has-box-indicator', className].filter(Boolean).join(' ')
  const input = <input type="range" className={merged || undefined} {...rest} />
  return vertical ? <div className="is-vertical">{input}</div> : input
}
