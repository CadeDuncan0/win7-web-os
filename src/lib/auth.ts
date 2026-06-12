import { AuthError, type Session } from '@supabase/supabase-js'
import z from 'zod'
import * as guestSession from '@/lib/guestSession'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_USER_ICON } from '@/lib/userIcons'

// ─── Types ──────────────────────────────────────────────────────────────────

// infer the TypeScript type directly from the schema
export type AppSession = z.infer<typeof AppSessionSchema>
export type AuthResult<T> = { ok: true; data: T } | { ok: false; error: string }

// ─── Constants ──────────────────────────────────────────────────────────────

const supabase = createClient()

export const AppSessionSchema = z.discriminatedUnion('role', [
  // Schema for the 'guest' role — owned by the guest session module so the
  // marker it persists and the union here can never drift apart.
  guestSession.GuestSessionSchema,
  // Schema for the 'admin' role
  z.object({
    role: z.literal('admin'),
    jwt: z.string(),
    startedAt: z.number(),
    // Sessions rehydrated from Supabase carry no logon pick — default it
    avatar: z.string().catch(DEFAULT_USER_ICON),
  }),
])

// ─── Guest Session ──────────────────────────────────────────────────────────

/**
 * Begins a Guest session. Delegates to the guest session module, which owns
 * the sessionStorage marker and the cookie; the avatar chosen on the logon
 * screen rides along so the desktop can greet the visitor with it.
 */
export function beginGuestSession(avatarSrc: string): AuthResult<AppSession> {
  const session = guestSession.beginGuestSession(avatarSrc)
  if (!session) {
    return { ok: false, error: 'window object is undefined' }
  }
  return { ok: true, data: session }
}

// ─── Admin Sign-In ──────────────────────────────────────────────────────────

/**
 * Authenticates the Admin via Supabase email + password.
 * The email is not a parameter — it is a build-time constant (the admin account
 * is fixed per deployment). The password comes from the login form; the avatar
 * is the logon-screen pick, persisted into the session payload.
 */
export async function signInAsAdmin(
  password: string,
  avatarSrc: string
): Promise<AuthResult<AppSession>> {
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
    avatar: avatarSrc,
  }

  return { ok: true, data: adminSession }
}

// ─── Sign-Out ───────────────────────────────────────────────────────────────

/**
 * Ends the current session, whatever its origin. Safe to call when no session
 * exists — idempotent.
 */
export async function signOut(): Promise<AuthResult<null>> {
  // guest session cleared (marker + cookie, both owned by the module)
  guestSession.clearGuestSession()

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
        startedAt: sessionStartedAtMs(authSession),
        // The logon pick is not persisted in Supabase — fall back to default
        avatar: DEFAULT_USER_ICON,
      }

      return adminSession
    }
  }

  // No Supabase session — the guest session module reads and validates its
  // own marker (evicting it if malformed or tampered).
  return guestSession.readGuestSession()
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Derives a Supabase session's issued-at time in milliseconds. Supabase
 * exposes expiry, not issuance — issued-at = expires_at − expires_in.
 * Falls back to "now" if expires_at is ever absent.
 */
export function sessionStartedAtMs(session: Session): number {
  if (session.expires_at === undefined) {
    return Date.now()
  }
  return (session.expires_at - session.expires_in) * 1000
}

/**
 * Extracts a user-facing error message from a Supabase AuthError.
 * Supabase's error objects are structured — do not just coerce to string.
 */
function extractMessage(error: AuthError | Error): string {
  return error.message
}
