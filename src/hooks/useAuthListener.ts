import { useEffect } from 'react'

import { getCurrentSession } from '@/lib/auth'
import { useAppDispatch } from '@/store/hooks'
import { setSession, clearSession } from '@/store/slices/sessionSlice'

/**
 * On app boot, rehydrates the session from its client-side markers (guest in
 * sessionStorage; the admin marker that mirrors the httpOnly cookie the proxy
 * gates on). Sign-in and sign-out dispatch their own state changes directly, so
 * this only covers the cold-start / reload case.
 */
export function useAuthListener(): void {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const session = getCurrentSession()
    if (session) {
      dispatch(setSession(session))
    } else {
      dispatch(clearSession())
    }
  }, [dispatch])
}
