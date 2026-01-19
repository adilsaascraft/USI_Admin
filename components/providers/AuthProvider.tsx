'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const hydrateUser = useAuthStore((state) => state.hydrateUser)
  const pathname = usePathname()

  useEffect(() => {
    if (PUBLIC_ROUTES.includes(pathname)) return
    hydrateUser()
  }, [hydrateUser, pathname])

  return <>{children}</>
}
