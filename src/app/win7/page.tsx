import { cookies } from 'next/headers'

import { DesktopScreen } from '@/components/screens/desktop/DesktopScreen'
import { LoginScreen } from '@/components/screens/login/LoginScreen'
import { ADMIN_COOKIE_NAME, isAdminCookieValid } from '@/lib/adminAuth'
import { GUEST_COOKIE_NAME } from '@/lib/guestSession'

/**
 * The OS lives at a single URL: this server component checks the session
 * cookies (the same gate the proxy applies to /win7/desktop) and renders
 * either the logon screen or the desktop. Signing in and out re-render the
 * page via router.refresh() — the address bar never changes, whether the app
 * is served at /win7, the domain root (rewritten in next.config.ts), or a
 * BASE_PATH mount point.
 */
export default async function Win7Page() {
  const cookieStore = await cookies()
  const isAdmin = await isAdminCookieValid(cookieStore.get(ADMIN_COOKIE_NAME)?.value)
  const isGuest = cookieStore.get(GUEST_COOKIE_NAME)?.value === '1'

  return isAdmin || isGuest ? <DesktopScreen /> : <LoginScreen />
}
