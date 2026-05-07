'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, SubmitEvent, useState } from 'react'

import { AccountTile } from '@/components/login/AccountTile/AccountTile'
import { PasswordInput } from '@/components/login/PasswordInput/PasswordInput'
import { SignInButton } from '@/components/login/SignInButton/SignInButton'
import { beginGuestSession, signInAsAdmin } from '@/lib/auth'
import { debug } from '@/lib/debug'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectAuthStatus, setSession } from '@/store/slices/sessionSlice'

import styles from './Login.module.css'

export default function LoginPage() {
  // states
  const [selected, setSelected] = useState<'guest' | 'admin' | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)

  // refs
  const passwordRef = useRef<HTMLInputElement>(null)

  // hooks
  const dispatch = useAppDispatch()
  const router = useRouter()
  const authStatus = useAppSelector(selectAuthStatus)

  // handlers
  const handleSelectGuest = () => {
    const authresult = beginGuestSession()

    if (!authresult.ok) {
      debug.error(authresult.error)
      return
    }

    dispatch(setSession(authresult.data))
  }

  const handleSelectAdmin = () => {
    setSelected('admin')
    setError(undefined)
    setPassword('')
  }

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()

    // guards empty submit; SignInButton will be disabled too — defense in depth)
    if (!password) {
      return
    }
    setSubmitting(true)

    const result = await signInAsAdmin(password)
    // failed sign in
    if (!result.ok) {
      setError(result.error)
      setPassword('')
      setSubmitting(false)
      passwordRef.current?.focus()
      return
    }
  }

  useEffect(() => {
    if (authStatus === 'authenticated') {
      router.replace('/desktop')
    }
  }, [authStatus, router])

  useEffect(() => {
    if (selected === 'admin') {
      passwordRef.current?.focus()
    }
  }, [selected])

  if (authStatus === 'unknown') {
    return <div className={styles.screen} />
  }

  return (
    <main className={styles.screen}>
      <div className={styles.tileRow}>
        <AccountTile
          label="Guest"
          glyph="👤"
          selected={selected === 'guest'}
          disabled={submitting}
          onSelect={handleSelectGuest}
        />
        <AccountTile
          label="Admin"
          glyph="🔒"
          selected={selected === 'admin'}
          disabled={submitting}
          onSelect={handleSelectAdmin}
        />
      </div>

      <AnimatePresence>
        {selected === 'admin' && (
          <motion.form
            key="admin-form"
            className={styles.passwordRow}
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <label htmlFor="admin-password" className={styles.visuallyHidden}>
              Password
            </label>
            <PasswordInput
              ref={passwordRef}
              value={password}
              onChange={setPassword}
              error={error}
              disabled={submitting}
              placeholder="Password"
              id="admin-password"
            />
            <SignInButton
              type="submit"
              disabled={submitting || !password} // empty pw can't submit
            />
          </motion.form>
        )}
      </AnimatePresence>
    </main>
  )
}
