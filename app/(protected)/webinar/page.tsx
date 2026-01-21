// app/(dashboard)/webinar/page.tsx
"use client"

import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import { WebinarType } from "@/types/webinar"
import WebinarPageClient from "@/components/clients/WebinarPageClient"

export default function WebinarPage() {
  const { data} = useSWR<{ success: boolean; data: WebinarType[] }>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/webinars`,
    fetcher,
    {
      revalidateOnFocus: true,   // refetch on tab focus
      dedupingInterval: 60000,   // cache for 60s
    }
  )

  const webinars = data?.success ? data.data : []

  return<WebinarPageClient  initialWebinars={webinars} />
}
