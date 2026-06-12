'use client'

import { ApolloProvider } from '@apollo/client/react'
import { useState, type ReactNode } from 'react'

import { makeApolloClient } from '@/lib/apollo-client'
import { useAppStore } from '@/store/hooks'
import { selectJwt } from '@/store/slices/sessionSlice'

interface ApolloProviderWrapperProps {
  children: ReactNode
}

export default function ApolloProviderWrapper({ children }: ApolloProviderWrapperProps) {
  // Nested inside ReduxProviderWrapper, so this is the per-request store.
  const store = useAppStore()
  // One client per request/mount; its auth link reads the JWT from THIS
  // request's store at request time (not at construction time).
  const [client] = useState(() => makeApolloClient(() => selectJwt(store.getState())))

  return <ApolloProvider client={client}>{children}</ApolloProvider>
}
