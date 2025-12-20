// lib/apiRequest.ts
import { fetchClient } from "./fetchClient";
import { toast } from "sonner";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiRequestConfig<TBody, TResponse> {
  endpoint: string;              // "/login"
  method?: HttpMethod;           // default: POST
  body?: TBody;                  // request payload
  params?: Record<string, any>;  // query params
  showToast?: boolean;
  successMessage?: string;
  onSuccess?: (data: TResponse) => void;
}

export async function apiRequest<
  TBody = unknown,
  TResponse = any
>({
  endpoint,
  method = "POST",
  body,
  params,
  showToast = false,
  successMessage,
  onSuccess,
}: ApiRequestConfig<TBody, TResponse>): Promise<TResponse> {
  // ✅ Build full URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL!;
  const url = new URL(`${baseUrl}${endpoint}`);

  // ✅ Query params support (GET filters, pagination, etc.)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  // ✅ Detect FormData
  const isFormData = body instanceof FormData;

  const response = await fetchClient(url.toString(), {
    method,
    body: body
      ? isFormData
        ? body
        : JSON.stringify(body)
      : undefined,
  });

  // ✅ Some DELETE / PUT APIs return empty body
  const data =
    response.status !== 204
      ? ((await response.json()) as TResponse)
      : ({} as TResponse);

  if (showToast) {
    toast.success(
      successMessage || "Operation completed successfully"
    );
  }

  onSuccess?.(data);
  return data;
}
