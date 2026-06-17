'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type SubmitEvent } from 'react'

import { AccountSelection, type AccountId } from '@/components/screens/login/AccountSelection'
import { SignIn } from '@/components/screens/login/SignIn'
import { Transition } from '@/components/screens/transition'
import { beginGuestSession, signInAsAdmin } from '@/lib/auth'
import { pickTwoDistinctIcons } from '@/lib/userIcons'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectAuthStatus, setSession } from '@/store/slices/sessionSlice'

export default function LoginPage() {
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
    if (!avatars) {
      return
    }
    if (id === 'guest') {
      const r = beginGuestSession(avatars.guest)
      if (!r.ok) {
        console.error(r.error)
        return
      }
      dispatch(setSession(r.data))
      return
    }
    setSigningInAs('admin')
    setError(undefined)
    setPassword('')
  }

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!password || !avatars) {
      return
    }
    setSubmitting(true)
    const r = await signInAsAdmin(password, avatars.admin)
    if (!r.ok) {
      setError(r.error)
      setPassword('')
      setSubmitting(false)
      passwordRef.current?.focus()
      return
    }
    // Dispatch immediately so the chosen avatar lands in the session before
    // (or after — the listener preserves it) the SIGNED_IN event arrives.
    dispatch(setSession(r.data))
  }

  const handleBack = () => {
    setSigningInAs(null)
    setPassword('')
    setError(undefined)
  }

  useEffect(() => {
    if (authStatus === 'authenticated') {
      const t = setTimeout(() => router.replace('/desktop'), 1600)
      return () => clearTimeout(t)
    }
  }, [authStatus, router])

  useEffect(() => {
    if (signingInAs === 'admin') {
      passwordRef.current?.focus()
    }
  }, [signingInAs])

  if (authStatus === 'authenticated') {
    return <Transition message="Welcome" />
  }
  if (authStatus === 'unknown' || accounts === null || avatars === null) {
    return <Transition message="Please wait..." />
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
  return <AccountSelection accounts={accounts} onSelect={handleSelect} />
}
