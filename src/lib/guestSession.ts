import z from 'zod'

import { DEFAULT_USER_ICON } from '@/lib/userIcons'

/** Single owner of every client representation of the Guest session:
 *
 *    1. The sessionStorage marker — tab-lifetime source of truth.
 *    2. The cookie — the server proxy's visibility into that marker.
 *
 *  (Redux holds the third, reactive copy; the auth layer dispatches it from
 *  the values returned here.) No other module touches the marker or the
 *  cookie directly — begin/clear/read keep both representations in lockstep. */

// Namespaced to prevent collisions with other sessionStorage consumers
// (browser extensions, embedded widgets).
const GUEST_SESSION_KEY = 'portfolio.guestSession'
const COOKIE_NAME = 'portfolio.guest'

export const GUEST_COOKIE_NAME = COOKIE_NAME

export const GuestSessionSchema = z.object({
  role: z.literal('guest'),
  jwt: z.null(),
  startedAt: z.number(),
  // Markers written before the avatar field existed parse to the default
  avatar: z.string().catch(DEFAULT_USER_ICON),
})

export type GuestSession = z.infer<typeof GuestSessionSchema>

/**
 * Begins a Guest session. No network call — Guest is a purely client-side
 * role assertion. Writes the sessionStorage marker (survives reloads within
 * the tab, ends when the tab closes) and the cookie the proxy reads.
 * Returns null when called outside a browser context.
 */
export function beginGuestSession(avatarSrc: string): GuestSession | null {
  if (typeof window === 'undefined') {
    return null
  }
  const session: GuestSession = {
    role: 'guest',
    jwt: null,
    startedAt: Date.now(),
    avatar: avatarSrc,
  }
  window.sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session))
  writeGuestCookie()
  return session
}

/** Removes both the marker and the cookie. Idempotent; safe on the server. */
export function clearGuestSession(): void {
  if (typeof window === 'undefined') {
    return
  }
  window.sessionStorage.removeItem(GUEST_SESSION_KEY)
  clearGuestCookie()
}

/**
 * Reads and validates the current Guest session, if any. A malformed or
 * tampered marker is evicted (cookie included) so the next read is clean.
 */
export function readGuestSession(): GuestSession | null {
  if (typeof window === 'undefined') {
    return null
  }
  const raw = window.sessionStorage.getItem(GUEST_SESSION_KEY)
  if (!raw) {
    return null
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    clearGuestSession()
    return null
  }
  const validated = GuestSessionSchema.safeParse(parsed)
  if (!validated.success) {
    clearGuestSession()
    return null
  }
  return validated.data
}

function writeGuestCookie(): void {
  // Session cookie (no Max-Age) — lives until the browser closes, mirroring
  // the sessionStorage marker's lifetime instead of expiring mid-session.
  // SameSite gets set by default to Lax.
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${COOKIE_NAME}=1; Path=/${secure}`
}

function clearGuestCookie(): void {
  // Using 0 for Max-Age deletes cookie
  document.cookie = `${COOKIE_NAME}=0; Path=/; Max-Age=${0}`
}
