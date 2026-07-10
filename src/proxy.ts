import { NextResponse, type NextRequest } from 'next/server'

import { ADMIN_COOKIE_NAME, isAdminCookieValid } from '@/lib/adminAuth'
import { GUEST_COOKIE_NAME } from '@/lib/guestSession'

export async function proxy(request: NextRequest) {
  // Admin: the httpOnly cookie must match the token derived from the secret.
  // Guest: a public, forgeable marker — Guest access is unauthenticated anyway.
  const isAdmin = await isAdminCookieValid(request.cookies.get(ADMIN_COOKIE_NAME)?.value)
  const isGuest = request.cookies.get(GUEST_COOKIE_NAME)?.value === '1'

  if (isAdmin || isGuest) {
    return NextResponse.next()
  }

  // Unauthenticated: redirect to the logon screen with original path preserved.
  // Clone nextUrl rather than building a raw URL — NextURL re-applies basePath
  // when serialized, so the redirect stays inside a BASE_PATH-mounted app.
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/win7'
  loginUrl.search = ''
  loginUrl.searchParams.set('from', request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/win7/desktop/:path*'],
}
