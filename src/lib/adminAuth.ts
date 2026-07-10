// Server-side Admin credential helper — shared by the login route handler
// (src/app/api/admin/route.ts) and the proxy gate (src/proxy.ts).
//
// A single secret, ADMIN_PASSWORD, is the entire Admin credential. It is a
// server-only env var (no NEXT_PUBLIC_ prefix), so it never reaches the browser.
// The httpOnly `win7.admin` cookie stores a SHA-256 token derived from that
// secret rather than the plaintext, so the password itself never rides in a
// cookie, yet both the login route and the proxy can verify the cookie
// statelessly by recomputing the same token. Web Crypto is a global in the
// Node.js runtime (proxy + route handlers), so no import is needed.

export const ADMIN_COOKIE_NAME = 'win7.admin'

// Domain-separation prefix hashed in with the password. The token is then not
// a bare SHA-256(password), so a leaked cookie value cannot be reversed with
// precomputed (rainbow) tables of common-password hashes.
const TOKEN_PREFIX = 'win7-admin-v1:'

/** Lowercase hex SHA-256 of the input. */
async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Constant-time string equality. Comparison time must not depend on how many
 * leading characters match — with `===`, an attacker measuring response times
 * could recover the expected token prefix by prefix.
 */
export function tokensEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
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
  return sha256Hex(TOKEN_PREFIX + password)
}

/**
 * Whether a submitted password matches the configured Admin secret. Compares
 * derived tokens rather than the raw strings so the check leaks no timing
 * signal about the secret itself.
 */
export async function isAdminPassword(password: string): Promise<boolean> {
  const expected = await adminToken()
  if (expected === null) {
    return false
  }
  return tokensEqual(await sha256Hex(TOKEN_PREFIX + password), expected)
}

/**
 * Whether a presented `win7.admin` cookie value is the valid Admin token —
 * the gate shared by the proxy and the /win7 server render switch. Always
 * false when Admin sign-in is unconfigured.
 */
export async function isAdminCookieValid(value: string | undefined): Promise<boolean> {
  const expected = await adminToken()
  return expected !== null && value !== undefined && tokensEqual(value, expected)
}
