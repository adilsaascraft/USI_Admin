
"use client";

import { useParams } from "next/navigation";
import SummaryClient from '@/components/clients/webinar/SummaryClient'

export default function SummaryPage() {
  const { webinarId } = useParams()
  if (!webinarId || Array.isArray(webinarId)) return null

  return (
    <div className="p-4">
      <SummaryClient webinarId={webinarId} />
    </div>
  )
}

