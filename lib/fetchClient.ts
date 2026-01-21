'use client'

import { useAuthStore } from '@/stores/authStore'

let refreshPromise: Promise<void> | null = null

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/refresh-token`,
      {
        method: 'POST',
        credentials: 'include',
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error('Refresh failed')
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

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (response.status === 401) {
    try {
      await refreshAccessToken()
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      })
    } catch {
      await useAuthStore.getState().logout()
      throw new Error('Session expired')
    }
  }

  if (!response.ok) {
    const err = await response.json().catch(() => null)
    throw new Error(err?.message || 'Request failed')
  }

  return response
}
