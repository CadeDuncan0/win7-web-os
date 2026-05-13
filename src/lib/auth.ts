import { AuthError } from '@supabase/supabase-js'
import z from 'zod'

import { createClient } from '@/lib/supabase/client'

// ─── Types ──────────────────────────────────────────────────────────────────

// infer the TypeScript type directly from the schema
export type AppSession = z.infer<typeof AppSessionSchema>
export type AuthResult<T> = { ok: true; data: T } | { ok: false; error: string }

// ─── Constants ──────────────────────────────────────────────────────────────

const supabase = createClient()
//  Namespaced to prevent collisions with other sessionStorage consumers (browser extensions, embedded widgets).
const GUEST_SESSION_KEY = 'portfolio.guestSession'

export const AppSessionSchema = z.discriminatedUnion('role', [
  // Schema for the 'guest' role
  z.object({
    role: z.literal('guest'),
    jwt: z.null(),
    startedAt: z.number(),
  }),
  // Schema for the 'admin' role
  z.object({
    role: z.literal('admin'),
    jwt: z.string(),
    startedAt: z.number(),
  }),
])

// ─── Guest Session ──────────────────────────────────────────────────────────

/**
 * Begins a Guest session. No network call — Guest is a purely client-side
 * role assertion. Writes a marker to sessionStorage so the session survives
 * a page reload within the same tab, and ends when the tab closes.
 */
export function beginGuestSession(): AuthResult<AppSession> {
  const guestSession: AppSession = {
    role: 'guest',
    jwt: null,
    startedAt: Date.now(),
  }
  if (typeof window === 'undefined') {
    return { ok: false, error: 'window object is undefined' }
  }
  window.sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(guestSession))
  return { ok: true, data: guestSession }
}

// ─── Admin Sign-In ──────────────────────────────────────────────────────────

/**
 * Authenticates the Admin via Supabase email + password.
 * The email is not a parameter — it is a build-time constant (the admin account
 * is fixed per deployment). The password comes from the login form.
 */
export async function signInAsAdmin(password: string): Promise<AuthResult<AppSession>> {
  const email = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  if (!email) {
    return { ok: false, error: 'Admin email not configured' }
  }

  // Validate admin credentials
  const adminCredentials = { email: email, password: password }

  const authResponse = await supabase.auth.signInWithPassword(adminCredentials)
  const authError = authResponse.error
  const authSession = authResponse.data.session

  // Error checks
  if (authError) {
    return { ok: false, error: extractMessage(authError) }
  }
  if (authSession === null) {
    return { ok: false, error: 'Sign-in succeeded but no session was returned' }
  }

  const adminSession: AppSession = {
    role: 'admin',
    jwt: authSession.access_token,
    startedAt: Date.now(),
  }

  return { ok: true, data: adminSession }
}

// ─── Sign-Out ───────────────────────────────────────────────────────────────

/**
 * Ends the current session, whatever its origin. Safe to call when no session
 * exists — idempotent.
 */
export async function signOut(): Promise<AuthResult<null>> {
  // guest session cleared
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(GUEST_SESSION_KEY)
  }
  // admin session cleared
  const logoutResponse = await supabase.auth.signOut()
  const logoutError = logoutResponse.error
  if (logoutError) {
    return { ok: false, error: extractMessage(logoutError) }
  }

  // session data cleared so return null
  return { ok: true, data: null }
}

// ─── Session Rehydration ────────────────────────────────────────────────────

/**
 * Returns the currently active session, if any. Called on app boot to
 * rehydrate state after a page reload. If both Guest and Admin indicators
 * are present (shouldn't happen, but can during dev), Admin takes precedence
 * — a real Supabase session is stronger evidence than a sessionStorage flag.
 */
export async function getCurrentSession(): Promise<AppSession | null> {
  // Get Supabase session
  const authResponse = await supabase.auth.getSession()
  const authSession = authResponse.data.session

  // Found admin session
  if (authSession) {
    // Validate JWT to protect against malicious users
    const validatedJWT = await supabase.auth.getUser(authSession.access_token)

    // user doesn't return JWT but does return email associated with JWT
    if (validatedJWT.data.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      const adminSession: AppSession = {
        role: 'admin',
        jwt: authSession.access_token,
        startedAt:
          // fallback: current time - 1 hour
          // types: all values should be in seconds
          ((authSession.expires_at ?? Date.now() / 1000 - 3600) - authSession.expires_in) * 1000,
      }

      return adminSession
    }
  }
  // Step 2: If no Supabase session, check sessionStorage for a Guest marker
  //   - Parse the JSON. If valid, return the Guest session.
  //   - If malformed (corrupted or tampered), remove the key and return null.
  if (typeof window === 'undefined') {
    return null
  }
  const guestSession = window.sessionStorage.getItem(GUEST_SESSION_KEY)
  if (guestSession) {
    const validatedSession = AppSessionSchema.safeParse(JSON.parse(guestSession))
    if (validatedSession.success) {
      return validatedSession.data
    }
    // data was malformed or tampered, remove session from storage
    window.sessionStorage.removeItem(GUEST_SESSION_KEY)
  }
  // Step 3: No session of either kind → return null
  // no session or session malformed / tampered
  return null
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Extracts a user-facing error message from a Supabase AuthError.
 * Supabase's error objects are structured — do not just coerce to string.
 */
function extractMessage(error: AuthError | Error): string {
  return error.message
}
