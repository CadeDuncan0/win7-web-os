'use client'

import { AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

import { InternetExplorerWindow } from '../InternetExplorer'
import { titleToRoute } from '../InternetExplorer/ieRoutes'
import { WindowWrapper } from '../WindowWrapper'
import { useAppSelector } from '@/store/hooks'
import { selectVisibleWindows, type WindowInstance } from '@/store/slices/windowSlice'

function renderWindowContent(win: WindowInstance): ReactNode {
  switch (win.kind) {
    case 'internet-explorer':
      return <InternetExplorerWindow initialRoute={titleToRoute(win.title)} />
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
