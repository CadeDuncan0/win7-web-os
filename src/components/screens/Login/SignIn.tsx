'use client'

import { type Ref, type SubmitEvent } from 'react'

import { AccountIcon } from '@/components/windows7/AccountIcon'
import { OsBranding } from '@/components/windows7/OsBranding'
import { SubmitButton } from '@/components/windows7/SubmitButton'

import styles from './SignIn.module.css'

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
    <div className="login__main">
      <main>
        <section className="signin__pane">
          <AccountIcon iconSrc={avatarSrc} subtitle={accountLabel} disabled={true} />

          <form className="signin__form" onSubmit={onSubmit}>
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
                  className={`signin__form-input`}
                />
              </div>

              <SubmitButton type="submit" aria-label="Sign in" disabled={submitting} />
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
              className={`signin__form-button ${styles.switchUser}`}
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
