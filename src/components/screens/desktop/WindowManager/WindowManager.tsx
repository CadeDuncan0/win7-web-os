'use client'

import { AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

import { InternetExplorerWindow } from '../InternetExplorer'
import { titleToRoute } from '../InternetExplorer/ieRoutes'
import { useAppSelector } from '@/store/hooks'
import { selectVisibleWindows, type WindowInstance } from '@/store/slices/windowSlice'

// Each window kind renders its own WindowWrapper so it can compose app-specific
// chrome (e.g. IE's nav/address toolbar lives inside the title bar). The key
// stays on the direct AnimatePresence child for correct exit animations.
function renderWindow(win: WindowInstance): ReactNode {
  switch (win.kind) {
    case 'internet-explorer':
      return (
        <InternetExplorerWindow
          key={win.id}
          windowId={win.id}
          initialRoute={titleToRoute(win.title)}
        />
      )
  }
}

export function WindowManager() {
  const visibleWindows = useAppSelector(selectVisibleWindows)

  return <AnimatePresence>{visibleWindows.map(renderWindow)}</AnimatePresence>
}
