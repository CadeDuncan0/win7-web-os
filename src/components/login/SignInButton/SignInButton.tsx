import styles from './SignInButton.module.css'

interface SignInButtonProps {
  onClick?: () => void
  disabled?: boolean
  ariaLabel?: string
  type?: 'button' | 'submit' | 'reset' | undefined
}

export function SignInButton({ onClick, disabled, ariaLabel, type }: SignInButtonProps) {
  const classes = styles.button + ' ' + (disabled ? styles.disabled : '')
  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? 'Sign in'}
      type={type ?? 'button'}
    >
      →
    </button>
  )
}
