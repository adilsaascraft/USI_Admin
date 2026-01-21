'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const hydrateUser = useAuthStore((s) => s.hydrateUser)
  const isHydrated = useAuthStore((s) => s.isHydrated)

  useEffect(() => {
    if (!isHydrated) hydrateUser()
  }, [hydrateUser, isHydrated])

  return <>{children}</>
}
