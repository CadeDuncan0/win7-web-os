import { Session } from '@supabase/supabase-js'
import { useEffect } from 'react'

import { AppSession, getCurrentSession, signOut } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import { useAppDispatch } from '@/store/hooks'
import { setSession, clearSession } from '@/store/slices/sessionSlice'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL
const supabase = createClient()

export function useAuthListener(): void {
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Helper closes over dispatch — no parameter plumbing
    async function applyAdminSession(session: Session) {
      if (session.user.email !== ADMIN_EMAIL) {
        await signOut()
        return
      }
      const payload = {
        role: 'admin',
        jwt: session.access_token,
        startedAt: ((session.expires_at ?? Date.now() / 1000 - 3600) - session.expires_in) * 1000,
      } satisfies AppSession
      dispatch(setSession(payload))
    }

    // onAuthStateChange returns { data: { subscription } }. Destructure it
    // so the cleanup function below can close the subscription.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // ── SIGNED_OUT ───────────────────────────────────────────────────

      if (event === 'SIGNED_OUT') {
        dispatch(clearSession())
        return
      }

      // ── SIGNED_IN / TOKEN_REFRESHED ──────────────────────────────────

      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        await applyAdminSession(session)
        return
      }
      // ── INITIAL_SESSION ──────────────────────────────────────────────

      // - Why the extra getCurrentSession call: INITIAL_SESSION only knows about
      //   Supabase-managed state; guest sessions live in sessionStorage.
      if (event === 'INITIAL_SESSION') {
        if (session) {
          await applyAdminSession(session)
          return
        } else {
          const activeSession = await getCurrentSession()
          if (activeSession) {
            dispatch(setSession(activeSession))
          } else {
            dispatch(clearSession())
          }
        }
      }
      // ── Other events ─────────────────────────────────────────────────
    })

    return () => subscription.unsubscribe()
  }, [dispatch])
}
