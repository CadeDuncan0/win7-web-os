'use client'

import type { ReactNode } from 'react'
import { Provider } from 'react-redux'

import { store } from '@/store'

interface ReduxProviderWrapperProps {
  children: ReactNode
}

export default function ReduxProviderWrapper({ children }: ReduxProviderWrapperProps) {
  return <Provider store={store}>{children}</Provider>
}
