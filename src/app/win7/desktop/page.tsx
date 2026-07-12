import { cookies } from 'next/headers'

import { DesktopScreen } from '@/components/screens/desktop/DesktopScreen'
import { ADMIN_COOKIE_NAME, isAdminCookieValid } from '@/lib/adminAuth'

// Gated deep link to the desktop (see src/proxy.ts). The primary flow renders
// the desktop at /win7 itself without ever changing the URL. The admin flag is
// derived the same way as at /win7 so per-role icon hiding applies here too
// (guest is the complement: !isAdmin).
export default async function DesktopPage() {
  const cookieStore = await cookies()
  const isAdmin = await isAdminCookieValid(cookieStore.get(ADMIN_COOKIE_NAME)?.value)

  return <DesktopScreen isAdmin={isAdmin} />
}
