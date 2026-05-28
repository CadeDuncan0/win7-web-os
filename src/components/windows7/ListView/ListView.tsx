import type { ComponentPropsWithRef } from 'react'

/* 7.css ListView (table)
   Doc: https://khang-nd.github.io/7.css/#listview
   Standard <table> with <thead> / <tbody>. 7.css applies Win7 column
   headers, row striping, and inner borders. Cells, rows, and headers
   are composed by consumers as plain JSX children. */
type ListViewProps = ComponentPropsWithRef<'table'>

export function ListView(props: ListViewProps) {
  return <table {...props} />
}
