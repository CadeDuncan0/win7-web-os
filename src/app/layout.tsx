import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { ReactNode } from 'react'

import ReduxProviderWrapper from '@/components/providers/ReduxProvider'

import '7.css'
import './globals.css'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReduxProviderWrapper>{children}</ReduxProviderWrapper>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
