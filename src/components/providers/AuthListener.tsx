'use client'

import { useAuthListener } from '@/hooks/useAuthListener'

export function AuthListener(): null {
  useAuthListener()
  return null
}
