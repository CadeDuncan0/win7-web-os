'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Transition } from '@/components/screens/Transition'
import { Button } from '@/components/windows7/Button'
import { signOut } from '@/lib/auth'
import { useAppSelector } from '@/store/hooks'
import { selectRole } from '@/store/slices/sessionSlice'

export default function DesktopPage() {
  const role = useAppSelector(selectRole)
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
      <h1>Welcome, {role} </h1>
      <Button onClick={handleSignOut}>Sign out</Button>
    </main>
  )
}
