'use client'

import { create } from 'zustand'
import { apiRequest } from '@/lib/apiRequest'

export type AuthUser = {
  id: string
  name: string
  email: string
  mobile?: string
  role: string
  status?: 'Pending' | 'Approved'
  profilePicture?: string
}

type AuthState = {
  user: AuthUser | null
  isHydrated: boolean

  hydrateUser: () => Promise<void>
  setUser: (user: AuthUser) => void
  updateUser: (data: Partial<AuthUser>) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isHydrated: false,

  /* ---------------- HYDRATE ADMIN SESSION ---------------- */
  hydrateUser: async () => {
    if (get().isHydrated) return // 🔐 guard

    try {
      const response = await apiRequest({
        endpoint: '/admin/me',
        method: 'GET',
      })

      if (!response?.authenticated) {
        throw new Error('Not authenticated')
      }

      const user = response.user

      set({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          status: user.status,
          profilePicture: user.profilePicture,
        },
        isHydrated: true,
      })
    } catch (error) {
      set({ user: null, isHydrated: true })
    }
  },

  /* ---------------- SET USER (LOGIN) ---------------- */
  setUser: (user) => set({ user }),

  /* ---------------- UPDATE USER ---------------- */
  updateUser: (data) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    })),

  /* ---------------- LOGOUT ---------------- */
  logout: async () => {
    try {
      await apiRequest({
        endpoint: '/admin/logout',
        method: 'POST',
      })
    } finally {
      set({ user: null, isHydrated: true })
    }
  },
}))
