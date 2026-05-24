'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type SubmitEvent } from 'react'

import { AccountSelection, type AccountId } from '@/components/screens/Login/AccountSelection'
import { SignIn } from '@/components/screens/Login/SignIn'
import { Welcome } from '@/components/screens/Login/Welcome'
import { beginGuestSession, signInAsAdmin } from '@/lib/auth'
import { debug } from '@/lib/debug'
import { pickTwoDistinctIcons } from '@/lib/userIcons'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectAuthStatus, setSession } from '@/store/slices/sessionSlice'

/* Login page — state machine orchestrator
   --------------------------------------------------------------------
   Which Login screen renders is a function of (authStatus, signingInAs):

     authStatus === 'authenticated'  → <Welcome />  → router.replace('/desktop')
     signingInAs === 'admin'         → <SignIn />
     otherwise                       → <AccountSelection />

   AccountSelection follows the win7simu copycat single-account model:
   it shows one avatar at a time and a "Switch user" button cycles to
   the next account. currentAccount is tracked here so returning from
   <SignIn /> via Back restores the last-viewed account.
   ==================================================================== */
export default function LoginPage() {
  const [currentAccount, setCurrentAccount] = useState<AccountId>('guest')
  const [signingInAs, setSigningInAs] = useState<AccountId | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)
  const [avatars, setAvatars] = useState<{ guest: string; admin: string } | null>(null)

  const passwordRef = useRef<HTMLInputElement>(null)
  const dispatch = useAppDispatch()
  const router = useRouter()
  const authStatus = useAppSelector(selectAuthStatus)

  // Random avatars are picked client-side after mount to avoid SSR/CSR
  // hydration mismatch (Math.random would diverge between server and client).
  useEffect(() => {
    const [guest, admin] = pickTwoDistinctIcons()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot RNG init; cannot use lazy state initializer without hydration mismatch.
    setAvatars({ guest, admin })
  }, [])

  const accounts = useMemo(
    () =>
      avatars
        ? ([
            { id: 'guest', label: 'Guest', avatarSrc: avatars.guest },
            { id: 'admin', label: 'Admin', avatarSrc: avatars.admin },
          ] as const)
        : null,
    [avatars]
  )

  const handleSelect = (id: AccountId) => {
    if (id === 'guest') {
      const r = beginGuestSession()
      if (!r.ok) {
        debug.error(r.error)
        return
      }
      dispatch(setSession(r.data))
      return
    }
    setSigningInAs('admin')
    setError(undefined)
    setPassword('')
  }

  const handleSwitch = () => {
    setCurrentAccount((c) => (c === 'guest' ? 'admin' : 'guest'))
  }

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!password) {
      return
    }
    setSubmitting(true)
    const r = await signInAsAdmin(password)
    if (!r.ok) {
      setError(r.error)
      setPassword('')
      setSubmitting(false)
      passwordRef.current?.focus()
    }
    // success: auth listener dispatches setSession; effect below transitions
    // to <Welcome /> and then to /desktop.
  }

  const handleBack = () => {
    setSigningInAs(null)
    setPassword('')
    setError(undefined)
  }

  useEffect(() => {
    if (authStatus === 'authenticated') {
      const t = setTimeout(() => router.replace('/desktop'), 800)
      return () => clearTimeout(t)
    }
  }, [authStatus, router])

  useEffect(() => {
    if (signingInAs === 'admin') {
      passwordRef.current?.focus()
    }
  }, [signingInAs])

  if (authStatus === 'authenticated') {
    return <Welcome />
  }
  if (authStatus === 'unknown' || accounts === null || avatars === null) {
    return null
  }
  if (signingInAs === 'admin') {
    return (
      <SignIn
        accountLabel="Admin"
        avatarSrc={avatars.admin}
        password={password}
        onPasswordChange={setPassword}
        onSubmit={handleSubmit}
        onBack={handleBack}
        error={error}
        submitting={submitting}
        passwordRef={passwordRef}
      />
    )
  }
  return (
    <AccountSelection
      accounts={accounts}
      currentId={currentAccount}
      onSwitch={handleSwitch}
      onSelect={handleSelect}
      disabled={submitting}
    />
  )
}
