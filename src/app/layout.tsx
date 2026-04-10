import type { ReactNode } from 'react'

import ApolloProviderWrapper from '@/components/providers/ApolloProvider'
import ReduxProviderWrapper from '@/components/providers/ReduxProvider'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReduxProviderWrapper>
          <ApolloProviderWrapper>{children}</ApolloProviderWrapper>
        </ReduxProviderWrapper>
      </body>
    </html>
  )
}
