import { WelcomeWindow } from './WelcomeWindow'
import type { WindowApp } from '@/components/apps/types'

export { WelcomeWindow }
export type { WelcomeWindowProps } from './WelcomeWindow'

/** This app's window identity: every window it opens is a Welcome window,
 *  grouped under this kind. Registry records reference the descriptor — never
 *  a raw kind string — so kind and component cannot drift apart. */
export const welcomeApp = {
  kind: 'welcome',
  component: WelcomeWindow,
} as const satisfies WindowApp
