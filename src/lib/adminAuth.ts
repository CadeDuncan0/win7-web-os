// Server-side Admin credential helper — shared by the login route handler
// (src/app/api/admin/route.ts) and the proxy gate (src/proxy.ts).
//
// A single secret, ADMIN_PASSWORD, is the entire Admin credential. It is a
// server-only env var (no NEXT_PUBLIC_ prefix), so it never reaches the browser.
// The httpOnly `win7.admin` cookie stores the SHA-256 of that secret rather than
// the plaintext, so the password itself never rides in a cookie, yet both the
// login route and the proxy can verify the cookie statelessly by recomputing the
// same hash. Web Crypto is a global in the Node.js runtime (proxy + route
// handlers), so no import is needed.

export const ADMIN_COOKIE_NAME = 'win7.admin'

/** Lowercase hex SHA-256 of the input. */
async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * The token to store in (and expect from) the `win7.admin` cookie, derived from
 * the configured secret. Returns null when ADMIN_PASSWORD is unset — Admin
 * sign-in is then disabled and no cookie value can ever match.
 */
export async function adminToken(): Promise<string | null> {
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    return null
  }
  return sha256Hex(password)
}

/** Whether a submitted password matches the configured Admin secret. */
export function isAdminPassword(password: string): boolean {
  const secret = process.env.ADMIN_PASSWORD
  return Boolean(secret) && password === secret
}
