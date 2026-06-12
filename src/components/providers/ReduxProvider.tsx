'use client'

import { useState, type ReactNode } from 'react'
import { Provider } from 'react-redux'

import { AuthListener } from '@/components/providers/AuthListener'
import { setupStore } from '@/store'

interface ReduxProviderWrapperProps {
  children: ReactNode
}

export default function ReduxProviderWrapper({ children }: ReduxProviderWrapperProps) {
  // One store per request/mount — never a module singleton, so server
  // renders can't leak state between concurrent requests. The lazy useState
  // initializer runs exactly once per mounted tree.
  const [store] = useState(() => setupStore())

  return (
    <Provider store={store}>
      <AuthListener />
      {children}
    </Provider>
  )
}
