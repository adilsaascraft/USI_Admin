import { create } from 'zustand'
import { apiRequest } from '@/lib/apiRequest'

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

export const useAuthStore = create<AuthState>((set, get) => ({
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

  // 🔐 Restore session from cookie
  hydrate: async () => {
    // Prevent multiple simultaneous hydration calls
    const state = get()
    if (!state.isLoading && state.isAuthenticated) {
      return
    }

    set({ isLoading: true })

    try {
      const data = await apiRequest<
        undefined,
        {
          authenticated: boolean
          user: {
            _id: string
            name: string
            email: string
            role: string
          }
        }
      >({
        endpoint: '/api/admin/me',
        method: 'GET',
        showToast: false,
      })

      if (!data.authenticated || !data.user) {
        throw new Error('Not authenticated')
      }

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
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },

  // 🚪 Logout
  logout: async () => {
    try {
      await apiRequest({
        endpoint: '/api/admin/logout',
        method: 'POST',
        showToast: false,
      })
    } catch (error) {
      // Ignore logout API errors
      console.error('Logout error:', error)
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },
}))
