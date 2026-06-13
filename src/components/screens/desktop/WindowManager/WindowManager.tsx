'use client'

import { AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

import { InternetExplorerWindow } from '../InternetExplorer'
import { titleToRoute } from '../InternetExplorer/ieRoutes'
import { WindowWrapper } from '../WindowWrapper'
import { useAppSelector } from '@/store/hooks'
import { selectVisibleWindows, type WindowInstance } from '@/store/slices/windowSlice'

function WelcomeContent() {
  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome to Windows 7</h2>
      <p>This is Cade Duncan&apos;s portfolio website.</p>
    </div>
  )
}

function AboutThisPCContent() {
  return (
    <div style={{ padding: 20 }}>
      <h2>About This PC</h2>
      <p>Windows 7 Portfolio Edition</p>
      <p>Built with Next.js, React, Redux, and TypeScript.</p>
    </div>
  )
}

function renderWindowContent(win: WindowInstance): ReactNode {
  switch (win.kind) {
    case 'internet-explorer':
      return <InternetExplorerWindow initialRoute={titleToRoute(win.title)} />
    case 'welcome':
      return <WelcomeContent />
    case 'about-this-pc':
      return <AboutThisPCContent />
  }
}

export function WindowManager() {
  const visibleWindows = useAppSelector(selectVisibleWindows)

  return (
    <AnimatePresence>
      {visibleWindows.map((win) => (
        <WindowWrapper key={win.id} windowId={win.id}>
          {renderWindowContent(win)}
        </WindowWrapper>
      ))}
    </AnimatePresence>
  )
}
