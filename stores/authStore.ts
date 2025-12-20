'use client'
import { create } from 'zustand'

type User = {
  id: string
  email: string
  role?: string
  name?: string
}

type AuthState = {
  user: User | null
  token: string | null
  setUser: (user: User | null, token?: string) => void
  hydrateUser: () => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,

  setUser: (user, token) => {
    if (token) {
      localStorage.setItem('token', token)
      set({ token })
    }
    set({ user })
  },

  hydrateUser: async () => {
    const token = localStorage.getItem('token')
    if (!token) return set({ user: null, token: null })

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (res.ok) {
        const data = await res.json()
        set({ user: data.user, token })
      } else {
        localStorage.removeItem('token')
        set({ user: null, token: null })
      }
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null })
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },
}))
