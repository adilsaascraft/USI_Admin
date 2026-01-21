"use client"

import { useParams } from "next/navigation"
import TopicClient from '@/components/clients/conference/TopicClient'

export default function TopicPage() {
  const { conferenceId } = useParams()

  if (!conferenceId || Array.isArray(conferenceId)) return null

  return (
    <div className="p-4">
      <TopicClient conferenceId={conferenceId} />
    </div>
  )
}
