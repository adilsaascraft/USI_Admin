// app/(dashboard)/events/page.tsx
"use client"

import useSWR from "swr"
import EventsPageClient from "@/components/clients/EventsPageClient"
import { fetcher } from "@/lib/fetcher"
import { EventType } from "@/types/event"

export default function EventsPage() {
  const { data} = useSWR<{ success: boolean; data: EventType[] }>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/events`,
    fetcher,
    {
      revalidateOnFocus: true,   // refetch on tab focus
      dedupingInterval: 60000,   // cache for 60s
    }
  )

  const events = data?.success ? data.data : []

  return<EventsPageClient  initialEvents={events} />
}
