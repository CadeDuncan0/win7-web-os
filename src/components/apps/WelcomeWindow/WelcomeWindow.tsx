'use client'

import styles from './WelcomeWindow.module.css'
import { WindowWrapper } from '@/components/shell/WindowWrapper'

export interface WelcomeWindowProps {
  /** Redux window id — wires the OS chrome (geometry, focus, controls). */
  windowId: string
}

/** Minimal static demo app. Exists to show the app-registration pattern:
 *  a `WindowApp` descriptor exported from this folder plus one record in
 *  `config/applications.ts` are all it takes to put a new window on the
 *  desktop. */
export function WelcomeWindow({ windowId }: WelcomeWindowProps) {
  return (
    <WindowWrapper windowId={windowId}>
      <div className={styles.body}>
        <h1 className={styles.heading}>Welcome</h1>
        <p>
          This is <strong>win7-web-os</strong> — a Windows 7 desktop environment that runs in the
          browser. Drag the icons, open windows, and explore.
        </p>
        <p>
          Forking this template? Open Internet Explorer and visit the Getting Started page — it maps
          the data registries (<code>applications.ts</code>, <code>ieRoutes.ts</code>,{' '}
          <code>notifications.ts</code>) where all the content lives.
        </p>
      </div>
    </WindowWrapper>
  )
}
