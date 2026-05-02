import type { Ref } from 'react'

import styles from './PasswordInput.module.css'

interface PasswordInputProps {
  value: string
  onChange: (next: string) => void
  error?: string
  disabled?: boolean
  placeholder?: string
  ref?: Ref<HTMLInputElement>
}

export function PasswordInput({
  value,
  onChange,
  error,
  disabled,
  placeholder,
  ref,
}: PasswordInputProps) {
  const classes =
    styles.input + ' ' + (error ? styles.error : '') + ' ' + (disabled ? styles.disabled : '')
  return (
    <div className={styles.wrapper}>
      <input
        type="password"
        className={classes}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        ref={ref}
        aria-label="Password"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'password-input-error-message' : undefined}
      />
      {error && (
        <span id="password-input-error-message" className={styles.errorMessage}>
          {error}
        </span>
      )}
    </div>
  )
}
