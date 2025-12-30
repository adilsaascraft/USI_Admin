
"use client";

import { useParams } from "next/navigation";
import MeetingClient from '@/components/clients/webinar/MeetingClient'

export default function MeetingPage() {
  const { webinarId } = useParams()
  if (!webinarId || Array.isArray(webinarId)) return null

  return (
    <div className="p-4">
      <MeetingClient webinarId={webinarId} />
    </div>
  )
}

