"use client"

import { useParams } from "next/navigation"
import TrackClient from "@/components/clients/conference/TrackClient"

export default function TrackPage() {
  const { conferenceId } = useParams()

  if (!conferenceId || Array.isArray(conferenceId)) return null

  return (
    <div className="p-4">
      <TrackClient conferenceId={conferenceId} />
    </div>
  )
}
