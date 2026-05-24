'use client'

import Image from 'next/image'
import { useState, type Ref, type SubmitEvent } from 'react'

import { AeroArrowButton } from '@/components/windows7/AeroArrowButton'
import { OsBranding } from '@/components/windows7/OsBranding'
import { ShutdownGroup } from '@/components/windows7/ShutdownGroup'

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

/* Login → Sign-In screen
   Mirrors .logon__pane in public/copycats/signin/signin.htm:

     avatar-button (idle — no .can-click since clicking does nothing here)
     logon__name (Admin label, matching the accountselection pattern)
     logon__form
       relative column ← anchors the absolute submit button
         logon__form-input  (password)
         logon__form-toggle (eye)
         logon__form-submit (circular blue arrow, left-full top-50%)
       logon__form-button.is-cancel  ("Back")

   The portfolio omits the copycat's username field, "Create new
   account" link, and social row — only password is required for the
   admin sign-in. */
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
  const [revealed, setRevealed] = useState(false)
  const errorId = error ? 'signin-error' : undefined

  return (
    <div className="logon__main">
      <main>
        <section className="logon__pane">
          <div className="avatar-button" aria-hidden="true">
            <span className="avatar-mask">
              <Image
                src={avatarSrc}
                alt=""
                width={98}
                height={98}
                unoptimized
                className="avatar-image"
              />
            </span>
          </div>

          <div className="logon__name">{accountLabel}</div>

          <form className="logon__form" onSubmit={onSubmit}>
            <div className={styles.fieldColumn}>
              <div className={styles.passwordWrapper}>
                <input
                  type={revealed ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  disabled={submitting}
                  ref={passwordRef}
                  aria-label="Password"
                  aria-invalid={Boolean(error)}
                  aria-describedby={errorId}
                  className={`logon__form-input ${styles.passwordInput}`}
                />
                <button
                  type="button"
                  aria-label={revealed ? 'Hide password' : 'Show password'}
                  aria-pressed={revealed}
                  onClick={() => setRevealed((v) => !v)}
                  className="logon__form-toggle"
                  tabIndex={-1}
                >
                  <EyeIcon revealed={revealed} />
                </button>
              </div>

              <AeroArrowButton
                type="submit"
                direction="right"
                aria-label="Sign in"
                disabled={submitting || !password}
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
              className="logon__form-button"
            >
              Back
            </button>
          </form>
        </section>
      </main>
      <OsBranding />
      <ShutdownGroup />
    </div>
  )
}

/* Eye glyph pair — open/closed states mirror the Font Awesome eye
   icon used in signin.htm (.logon__form-toggle). Inline so no icon
   font is required. */
function EyeIcon({ revealed }: { revealed: boolean }) {
  if (revealed) {
    return (
      <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true">
        <path
          fill="currentColor"
          d="M9 1C4.5 1 1 7 1 7s3.5 6 8 6 8-6 8-6-3.5-6-8-6Zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        />
      </svg>
    )
  }
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9 1C4.5 1 1 7 1 7s1.4 2.4 4 4.3l1.5-1.4A4 4 0 0 1 9 3c2.2 0 4 1.8 4 4 0 .9-.3 1.7-.8 2.4l2 1.9C16.4 9.6 17 7 17 7s-3.5-6-8-6Zm5.5 12.5L3 2 1.5 3.5 13 15l1.5-1.5Z"
      />
    </svg>
  )
}
