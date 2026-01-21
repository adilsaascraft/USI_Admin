
"use client";

import { useParams } from "next/navigation";
import CommunicationClient from '@/components/clients/webinar/CommunicationClient'

export default function CommunicationPage() {
  const { webinarId } = useParams()
  if (!webinarId || Array.isArray(webinarId)) return null

  return (
    <div className="p-4">
      <CommunicationClient webinarId={webinarId} />
    </div>
  )
}

