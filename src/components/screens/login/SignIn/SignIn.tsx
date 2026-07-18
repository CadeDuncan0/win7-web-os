'use client'

import { type Ref, type SubmitEvent } from 'react'

import login from '../Login.module.css'
import styles from './SignIn.module.css'
import { AccountIcon } from '@/components/ui/AccountIcon'
import { ArrowButton } from '@/components/ui/ArrowButton'
import { OsBranding } from '@/components/ui/OsBranding'

interface SignInProps {
  accountLabel: string
  avatarSrc: string
  password: string
  onPasswordChange: (next: string) => void
  onSubmit: (e: SubmitEvent<HTMLFormElement>) => void
  onBack: () => void
  error?: string
  submitting?: boolean
  passwordRef?: Ref<HTMLInputElement>
}

export function SignIn({
  accountLabel,
  avatarSrc,
  password,
  onPasswordChange,
  onSubmit,
  onBack,
  error,
  submitting,
  passwordRef,
}: SignInProps) {
  const errorId = error ? 'signin-error' : undefined

  return (
    <div className={login.main}>
      <main>
        <section className={styles.pane}>
          <AccountIcon iconSrc={avatarSrc} subtitle={accountLabel} disabled={true} />

          <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.fieldColumn}>
              <div className={styles.passwordWrapper}>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  disabled={submitting}
                  ref={passwordRef}
                  aria-label="Password"
                  aria-invalid={Boolean(error)}
                  aria-describedby={errorId}
                  className={styles.formInput}
                />
              </div>

              <ArrowButton
                type="submit"
                aria-label="Sign in"
                disabled={submitting}
                className={styles.submit}
              />
            </div>

            {error && (
              <span id={errorId} className={styles.error}>
                {error}
              </span>
            )}

            <button
              type="button"
              onClick={onBack}
              disabled={submitting}
              className={styles.switchUser}
            >
              Switch User
            </button>
          </form>
        </section>
      </main>
      <OsBranding />
    </div>
  )
}
