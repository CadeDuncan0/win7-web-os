'use client'

import { ApolloProvider } from '@apollo/client/react'
import type { ReactNode } from 'react'

import apolloClient from '@/lib/apollo-client'

interface ApolloProviderWrapperProps {
  children: ReactNode
}

export default function ApolloProviderWrapper({ children }: ApolloProviderWrapperProps) {
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
}
