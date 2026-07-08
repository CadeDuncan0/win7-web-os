'use client'

import { WindowWrapper } from '../WindowWrapper'
import styles from './WelcomeWindow.module.css'

export interface WelcomeWindowProps {
  /** Redux window id — wires the OS chrome (geometry, focus, controls). */
  windowId: string
}

/** Minimal static demo app. Exists to show the app-registration pattern:
 *  a `WindowKind`, a `WindowManager` case, taskbar meta, and registry entries
 *  are all it takes to put a new window on the desktop. */
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
          Forking this scaffold? Open Internet Explorer and visit the Getting Started page, or head
          straight to <code>src/config/site.ts</code>.
        </p>
      </div>
    </WindowWrapper>
  )
}
