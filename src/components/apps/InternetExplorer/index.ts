import { InternetExplorerWindow } from './InternetExplorerWindow'
import type { WindowApp } from '@/components/apps/types'

export { InternetExplorerWindow }
export type { InternetExplorerWindowProps } from './InternetExplorerWindow'

/** This app's window identity: every window it opens is an IE window, grouped
 *  under this kind. Registry records reference the descriptor — never a raw
 *  kind string — so kind and component cannot drift apart. */
export const internetExplorerApp = {
  kind: 'internet-explorer',
  component: InternetExplorerWindow,
} as const satisfies WindowApp
