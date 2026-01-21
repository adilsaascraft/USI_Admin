'use client'

import { create } from 'zustand'
import { Request } from '@/lib/apiRequest'

export type AuthUser = {
  id: string
  name: string
  email: string
  mobile?: string
  role: string
}

type AuthState = {
  user: AuthUser | null
  isHydrated: boolean
  setUser: (user: AuthUser) => void
  hydrateUser: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isHydrated: false,

  setUser: (user) =>
    set({
      user,
      isHydrated: true,
    }),

  hydrateUser: async () => {
    if (get().isHydrated) return

    try {
      const res = await Request<null, {
        authenticated: boolean
        user?: AuthUser
      }>({
        endpoint: '/api/admin/me',
        method: 'GET',
      })

      if (res.authenticated && res.user) {
        set({ user: res.user, isHydrated: true })
      } else {
        set({ user: null, isHydrated: true })
      }
    } catch {
      set({ user: null, isHydrated: true })
    }
  },

  logout: async () => {
    try {
      await Request({
        endpoint: '/api/admin/logout',
        method: 'POST',
      })
    } finally {
      set({ user: null, isHydrated: true })
    }
  },
}))
