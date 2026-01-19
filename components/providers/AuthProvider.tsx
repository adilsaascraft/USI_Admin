'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const hydrateUser = useAuthStore((state) => state.hydrateUser)

  useEffect(() => {
    hydrateUser()
  }, [hydrateUser])

  return <>{children}</>
}
