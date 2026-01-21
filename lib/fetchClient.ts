'use client'

import { useAuthStore } from '@/stores/authStore'

let isRefreshing = false
let refreshPromise: Promise<void> | null = null

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/refresh-token`,
      {
        method: 'POST',
        credentials: 'include',
      },
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error('Refresh failed')
        }
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export async function fetchClient(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })

  const isRefreshRequest = url.includes('/admin/refresh-token')

  // 🔐 Access token expired
  if (response.status === 401 && !isRefreshRequest) {
    try {
      if (!isRefreshing) {
        isRefreshing = true
        await refreshAccessToken()
        isRefreshing = false
      } else {
        await refreshPromise
      }

      // 🔁 retry original request ONCE
      return fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      })
    } catch {
      isRefreshing = false

      const store = useAuthStore.getState()
      await store.logout()

      // ❌ DO NOT redirect here
      throw new Error('Session expired')
    }

  }

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.message || 'Request failed')
  }

  return response
}
