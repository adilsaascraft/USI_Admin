import { create } from 'zustand'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean

  setUser: (user: User) => void
  clearUser: () => void
  hydrate: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    }),

  clearUser: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  hydrate: async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/me`,
        {
          credentials: 'include',
          cache: 'no-store',
        },
      )

      if (!res.ok) throw new Error()

      const data = await res.json()

      set({
        user: {
          id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
        },
        isAuthenticated: true,
        isLoading: false,
      })
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },

  logout: async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/logout`, {
      method: 'POST',
      credentials: 'include',
    })

    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },
}))
