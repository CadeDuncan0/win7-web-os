import z from 'zod'

import * as adminSession from '@/lib/adminSession'
import * as guestSession from '@/lib/guestSession'

// ─── Types ──────────────────────────────────────────────────────────────────

// infer the TypeScript type directly from the schema
export type AppSession = z.infer<typeof AppSessionSchema>
export type AuthResult<T> = { ok: true; data: T } | { ok: false; error: string }

// ─── Constants ──────────────────────────────────────────────────────────────

export const AppSessionSchema = z.discriminatedUnion('role', [
  // Each role's schema is owned by the module that persists its client marker,
  // so the marker written and the union here can never drift apart.
  guestSession.GuestSessionSchema,
  adminSession.AdminSessionSchema,
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

// ─── Admin Sign-In ────────────────────────────────────────────────────────

/**
 * Authenticates the Admin by posting the entered password to `/api/admin`,
 * which compares it to the server-only ADMIN_PASSWORD secret and, on success,
 * sets the httpOnly cookie the proxy gates on. The avatar is the logon-screen
 * pick, recorded in the client marker so a reload can restore it.
 */
export async function signInAsAdmin(
  password: string,
  avatarSrc: string
): Promise<AuthResult<AppSession>> {
  let response: Response
  try {
    response = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
  } catch {
    return { ok: false, error: 'Network error — please try again' }
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    return { ok: false, error: data?.error ?? 'Sign-in failed' }
  }

  const session = adminSession.beginAdminSession(avatarSrc)
  if (!session) {
    return { ok: false, error: 'window object is undefined' }
  }
  return { ok: true, data: session }
}

// ─── Sign-Out ───────────────────────────────────────────────────────────────

/**
 * Ends the current session, whatever its origin. Clears both client markers and
 * asks the server to drop the httpOnly Admin cookie. Safe to call when no
 * session exists — idempotent.
 */
export async function signOut(): Promise<AuthResult<null>> {
  // Client markers (guest marker + cookie; admin marker) cleared locally.
  guestSession.clearGuestSession()
  adminSession.clearAdminSession()

  // Ask the server to clear the httpOnly admin cookie. Best effort — the markers
  // are already gone and the cookie expires when the browser closes regardless.
  try {
    await fetch('/api/admin', { method: 'DELETE' })
  } catch {
    // ignore — see above
  }

  return { ok: true, data: null }
}

// ─── Session Rehydration ────────────────────────────────────────────────────

/**
 * Returns the currently active session, if any. Called on app boot to rehydrate
 * state after a page reload, reading each role's client marker. Admin takes
 * precedence over Guest if both are somehow present.
 */
export function getCurrentSession(): AppSession | null {
  return adminSession.readAdminSession() ?? guestSession.readGuestSession()
}
