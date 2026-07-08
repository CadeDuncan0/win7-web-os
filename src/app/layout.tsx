import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import ReduxProviderWrapper from '@/components/providers/ReduxProvider'

// globals.css imports 7.css into a low cascade layer (see globals.css header)
import './globals.css'

export const metadata: Metadata = {
  title: 'win7-web-os',
  description:
    'A Windows 7 desktop environment built with React and Next.js — fork it and make it your own.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReduxProviderWrapper>{children}</ReduxProviderWrapper>
      </body>
    </html>
  )
}
