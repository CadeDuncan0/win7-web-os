'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Desktop } from '@/components/screens/desktop/Desktop'
import { Transition } from '@/components/screens/Transition'
import { Button } from '@/components/windows7/Button/Button'
import { signOut } from '@/lib/auth'

export default function DesktopPage() {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
    setTimeout(() => router.replace('/login'), 1600)
  }
  if (isSigningOut) {
    return <Transition message="Logging off..." />
  }
  return (
    <main>
      <Desktop />
      <Button onClick={handleSignOut} aria-label="Sign out">
        Sign Out
      </Button>
    </main>
  )
}
