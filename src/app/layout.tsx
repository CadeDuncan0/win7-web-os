import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
