'use client'

import { AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

import { applicationByKey } from '@/config/applications'
import { useAppSelector } from '@/store/hooks'
import { selectVisibleWindows, type WindowInstance } from '@/store/slices/windowSlice'

// The application registry maps each window's appKey to its app-module
// descriptor (kind + component), so a new app never touches this file. Each
// app component renders its own WindowWrapper so it can compose app-specific
// chrome (e.g. IE's nav/address toolbar lives inside the title bar). The key
// stays on the direct AnimatePresence child for correct exit animations.
function renderWindow(win: WindowInstance): ReactNode {
  const app = applicationByKey(win.appKey)
  if (!app?.component) {
    return null
  }
  const AppComponent = app.component.component
  return <AppComponent key={win.id} windowId={win.id} initialRoute={app.ieRoute} />
}

export function WindowManager() {
  const visibleWindows = useAppSelector(selectVisibleWindows)

  return <AnimatePresence>{visibleWindows.map(renderWindow)}</AnimatePresence>
}
