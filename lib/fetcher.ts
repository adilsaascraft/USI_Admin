// lib/fetcher.ts
import { fetchClient } from "./fetchClient"
export const fetcher = async (url: string) => {
  const res = await fetchClient(url)
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}
