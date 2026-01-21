// app/(dashboard)/conference/page.tsx
"use client"

import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import { ConferenceType } from "@/types/conference"
import ConferencePageClient from "@/components/clients/ConferencePageClient"

export default function ConferencePage() {
  const { data} = useSWR<{ success: boolean; data: ConferenceType[] }>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/conferences`,
    fetcher,
    {
      revalidateOnFocus: true,   // refetch on tab focus
      dedupingInterval: 60000,   // cache for 60s
    }
  )

  const conferences = data?.success ? data.data : []

  return<ConferencePageClient  initialConferences={conferences} />
}
