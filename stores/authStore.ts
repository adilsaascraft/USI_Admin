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
  updateUser: (data: Partial<AuthUser>) => void
  hydrateUser: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isHydrated: false,

  /* ---------------- Set user directly (used on login) ---------------- */
  setUser: (user) =>
    set({
      user,
      isHydrated: true, // 🔐 mark hydrated immediately
    }),

  /* ---------------- Update user safely ---------------- */
  updateUser: (data) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : state.user,
    })),

  /* ---------------- Hydration (NO profile  for admin) ---------------- */
  hydrateUser: async () => {
    const { isHydrated } = get()
    if (isHydrated) return // 🔐 hard guard

    try {
      /**
       * If you have a lightweight endpoint like:
       *   GET /auth/me
       * that reads cookies and returns { id, name, email, role }
       * USE IT HERE.
       *
       * Otherwise — simply mark hydrated.
       */

      // ❌ DO NOT call /users/profile for admin
      set({ isHydrated: true })
    } catch {
      set({ user: null, isHydrated: true })
    }
  },

  /* ---------------- Logout ---------------- */
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
