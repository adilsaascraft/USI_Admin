
"use client";

import { useParams } from "next/navigation";
import FeedbackClient from '@/components/clients/webinar/FeedbackClient'

export default function FeedbackPage() {
  const { webinarId } = useParams()
  if (!webinarId || Array.isArray(webinarId)) return null

  return (
    <div className="p-4">
      <FeedbackClient webinarId={webinarId} />
    </div>
  )
}

