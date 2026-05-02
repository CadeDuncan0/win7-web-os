import styles from './SignInButton.module.css'

interface SignInButtonProps {
  onClick: () => void
  disabled?: boolean
  ariaLabel?: string
}

export function SignInButton({ onClick, disabled, ariaLabel }: SignInButtonProps) {
  const classes = styles.button + ' ' + (disabled ? styles.disabled : '')
  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? 'Sign in'}
    >
      →
    </button>
  )
}
