// lib/apiRequest.ts
import { fetchClient } from './fetchClient'
import { toast } from 'sonner'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface ApiRequestConfig<TBody, TResponse> {
  endpoint: string
  method?: HttpMethod
  body?: TBody
  params?: Record<string, any>
  showToast?: boolean
  successMessage?: string
  onSuccess?: (data: TResponse) => void
}

export async function apiRequest<
  TBody = unknown,
  TResponse = any
>({
  endpoint,
  method = 'POST',
  body,
  params,
  showToast = false,
  successMessage,
  onSuccess,
}: ApiRequestConfig<TBody, TResponse>): Promise<TResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL!

  // ✅ SUPPORT RELATIVE + ABSOLUTE BASE URL
  const url =
    baseUrl.startsWith('http')
      ? new URL(`${baseUrl}${endpoint}`)
      : new URL(`${baseUrl}${endpoint}`, window.location.origin)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  const isFormData = body instanceof FormData

  const response = await fetchClient(url.toString(), {
    method,
    body: body
      ? isFormData
        ? body
        : JSON.stringify(body)
      : undefined,
  })

  const data =
    response.status !== 204
      ? ((await response.json()) as TResponse)
      : ({} as TResponse)

  if (showToast) {
    toast.success(successMessage || 'Operation completed successfully')
  }

  onSuccess?.(data)
  return data
}
