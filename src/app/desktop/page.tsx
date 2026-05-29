'use client'

// import { useRouter } from 'next/navigation'
// import { useState } from 'react'
// import { Transition } from '@/components/screens/Transition'
// import { signOut } from '@/lib/auth'

import styles from './page.module.css'

export default function DesktopPage() {
  // const router = useRouter()
  // const [isSigningOut, setIsSigningOut] = useState(false)

  // const handleSignOut = async () => {
  //   setIsSigningOut(true)
  //   await signOut()
  //   setTimeout(() => router.replace('/login'), 1600)
  // }
  // if (isSigningOut) {
  //   return <Transition message="Logging off..." />
  // }
  return <main className={styles.main}></main>
}
