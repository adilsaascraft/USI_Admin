'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

export default function Home() {
  const router = useRouter()
  const { user, isHydrated } = useAuthStore()

 useEffect(() => {
  if (!isHydrated) return

  if (user) {
    router.replace('/dashboard')
  } else {
    router.replace('/login')
  }
}, [isHydrated]) // 🔥 REMOVE `user`


  return null
}
