import { OsBranding } from '@/components/windows7/OsBranding'
import { Spinner } from '@/components/windows7/Spinner'

interface TransitionProps {
  message: string
}

export function Transition({ message }: TransitionProps) {
  return (
    <div className="login__main" role="status" aria-live="polite">
      <div className="transition__loading">
        <Spinner variant="loading" aria-label="Loading" />
        <span>{message}</span>
      </div>
      <OsBranding />
    </div>
  )
}
