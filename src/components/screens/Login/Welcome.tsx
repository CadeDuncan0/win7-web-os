import { OsBranding } from '@/components/windows7/OsBranding'
import { ShutdownGroup } from '@/components/windows7/ShutdownGroup'
import { Spinner } from '@/components/windows7/Spinner'

interface WelcomeProps {
  message?: string
}

/* Login → Welcome screen
   Mirrors the .logon__loading row from
   public/copycats/signin/signin.htm — a small spinner + single-line
   "Logging on. Please wait..." text shown after Guest entry or
   successful Admin sign-in, immediately before the router replaces
   the route with /desktop. */
export function Welcome({ message = 'Logging on. Please wait…' }: WelcomeProps) {
  return (
    <div className="logon__main" role="status" aria-live="polite">
      <div className="logon__loading">
        <Spinner aria-label="Loading" />
        <span>{message}</span>
      </div>
      <OsBranding />
      <ShutdownGroup />
    </div>
  )
}
