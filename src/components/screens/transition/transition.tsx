import login from '../login/Login.module.css'
import styles from './transition.module.css'
import { OsBranding } from '@/components/windows7/OsBranding'
import { Spinner } from '@/components/windows7/Spinner'

interface TransitionProps {
  message: string
}

export function Transition({ message }: TransitionProps) {
  return (
    <div className={login.main} role="status" aria-live="polite">
      <div className={styles.loading}>
        <Spinner variant="loading" aria-label="Loading" />
        <span className={styles.message}>{message}</span>
      </div>
      <OsBranding />
    </div>
  )
}
