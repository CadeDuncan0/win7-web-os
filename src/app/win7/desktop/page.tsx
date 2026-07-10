import { DesktopScreen } from '@/components/screens/desktop/DesktopScreen'

// Gated deep link to the desktop (see src/proxy.ts). The primary flow renders
// the desktop at /win7 itself without ever changing the URL.
export default function DesktopPage() {
  return <DesktopScreen />
}
