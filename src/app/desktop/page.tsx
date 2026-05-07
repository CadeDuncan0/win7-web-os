'use client'
import { useRouter } from 'next/navigation'

import { SignInButton } from '@/components/login/SignInButton/SignInButton'
import { signOut } from '@/lib/auth'
import { useAppSelector } from '@/store/hooks'
import { selectRole } from '@/store/slices/sessionSlice'

export default function DesktopPage() {
  const role = useAppSelector(selectRole)
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
  }
  return (
    <main>
      <h1>Welcome, {role} </h1>
      <SignInButton onClick={handleSignOut} />
    </main>
  )
}
