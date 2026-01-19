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

  /* ----------------------------------------------------
     Set user (ONLY after successful login response)
  ---------------------------------------------------- */
  setUser: (user) => {
    set({
      user,
      isHydrated: true,
    })
  },

  /* ----------------------------------------------------
     Hydrate from cookie session (/admin/me)
  ---------------------------------------------------- */
  hydrateUser: async () => {
    if (get().isHydrated) return

    try {
      const res = await Request<null, {
        authenticated: boolean
        user?: AuthUser
      }>({
        endpoint: '/admin/me',
        method: 'GET',
      })

      if (res.authenticated && res.user) {
        set({ user: res.user, isHydrated: true })
      } else {
        set({ user: null, isHydrated: true })
      }
    } catch {
      // ❌ not authenticated or refresh failed
      set({ user: null, isHydrated: true })
    }
  },

  /* ----------------------------------------------------
     Logout (backend clears cookies)
  ---------------------------------------------------- */
  logout: async () => {
    try {
      await Request({
        endpoint: '/admin/logout',
        method: 'POST',
      })
    } finally {
      set({
        user: null,
        isHydrated: true,
      })
    }
  },
}))
