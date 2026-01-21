// lib/fetcher.ts
import { fetchClient } from './fetchClient'
export const fetcher = async (url: string) => {
  const res = await fetchClient(url)
  return res.json()
}
