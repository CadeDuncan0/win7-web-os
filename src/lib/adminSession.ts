import z from 'zod'

import { DEFAULT_USER_ICON } from '@/lib/userIcons'

/** Client-side marker for the Admin session, mirroring the guest session module.
 *
 *  The authoritative Admin credential is the httpOnly `win7.admin` cookie set by
 *  the server (`/api/admin`) and verified by the proxy. This sessionStorage
 *  marker is only the client's reactive hint, so Redux can rehydrate the role
 *  and avatar after a reload without reading the (unreadable) httpOnly cookie.
 *  Forging it grants nothing — the proxy gate still requires the cookie, so a
 *  tampered marker just bounces off `/win7/desktop` back to the logon screen. */

// Namespaced to prevent collisions with other sessionStorage consumers.
const ADMIN_SESSION_KEY = 'win7.adminSession'

export const AdminSessionSchema = z.object({
  role: z.literal('admin'),
  startedAt: z.number(),
  // A marker with a missing or malformed avatar parses to the default
  avatar: z.string().catch(DEFAULT_USER_ICON),
})

export type AdminSession = z.infer<typeof AdminSessionSchema>

/**
 * Records the marker for an Admin session that the server has just established
 * (the httpOnly cookie is set by `/api/admin`). The avatar chosen on the logon
 * screen rides along so the desktop can greet the user with it after a reload.
 * Returns null when called outside a browser context.
 */
export function beginAdminSession(avatarSrc: string): AdminSession | null {
  if (typeof window === 'undefined') {
    return null
  }
  const session: AdminSession = {
    role: 'admin',
    startedAt: Date.now(),
    avatar: avatarSrc,
  }
  window.sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
  return session
}

/** Removes the marker. Idempotent; safe on the server. */
export function clearAdminSession(): void {
  if (typeof window === 'undefined') {
    return
  }
  window.sessionStorage.removeItem(ADMIN_SESSION_KEY)
}

/**
 * Reads and validates the current Admin marker, if any. A malformed or tampered
 * marker is evicted so the next read is clean.
 */
export function readAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') {
    return null
  }
  const raw = window.sessionStorage.getItem(ADMIN_SESSION_KEY)
  if (!raw) {
    return null
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    clearAdminSession()
    return null
  }
  const validated = AdminSessionSchema.safeParse(parsed)
  if (!validated.success) {
    clearAdminSession()
    return null
  }
  return validated.data
}
