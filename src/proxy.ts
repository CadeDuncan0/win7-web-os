import { NextResponse, type NextRequest } from 'next/server'

import { ADMIN_COOKIE_NAME, adminToken } from '@/lib/adminAuth'
import { GUEST_COOKIE_NAME } from '@/lib/guestSession'

export async function proxy(request: NextRequest) {
  // Admin: the httpOnly cookie must match the SHA-256 of the configured secret.
  // Guest: a public, forgeable marker — Guest access is unauthenticated anyway.
  const expectedAdmin = await adminToken()
  const isAdmin =
    expectedAdmin !== null && request.cookies.get(ADMIN_COOKIE_NAME)?.value === expectedAdmin
  const isGuest = request.cookies.get(GUEST_COOKIE_NAME)?.value === '1'

  if (isAdmin || isGuest) {
    return NextResponse.next()
  }

  // Unauthenticated: redirect to the logon screen with original path preserved.
  const loginUrl = new URL('/win7', request.url)
  loginUrl.searchParams.set('from', request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/win7/desktop/:path*'],
}
