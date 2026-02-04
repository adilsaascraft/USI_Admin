'use client'

import { useAuthStore } from '@/stores/authStore'

let isRefreshing = false
let refreshPromise: Promise<Response> | null = null

async function refreshAccessToken(): Promise<Response> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/refresh-token`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )

  if (!response.ok) {
    throw new Error('Refresh failed')
  }

  return response
}

export async function fetchClient(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // ⚠️ CRITICAL: Send cookies
  })

  const isRefreshRequest = url.includes('/api/admin/refresh-token')
  const isLoginRequest = url.includes('/api/admin/login')

  // 🔐 Handle 401 - Token expired
  if (response.status === 401 && !isRefreshRequest && !isLoginRequest) {
    try {
      // Prevent multiple simultaneous refresh attempts
      if (!isRefreshing) {
        isRefreshing = true
        refreshPromise = refreshAccessToken()
      }

      // Wait for refresh to complete
      await refreshPromise

      isRefreshing = false
      refreshPromise = null

      // 🔁 Retry original request with new token
      return fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      })
    } catch (error) {
      isRefreshing = false
      refreshPromise = null

      // 🚪 Force logout on refresh failure
      const store = useAuthStore.getState()
      store.clearUser()

      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }

      throw new Error('Session expired. Please login again.')
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.message || 'Request failed')
  }

  return response
}
