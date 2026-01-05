
"use client";

import { useParams } from "next/navigation";
import QuestionClient from '@/components/clients/webinar/QuestionClient'

export default function QuestionPage() {
  const { webinarId } = useParams()
  if (!webinarId || Array.isArray(webinarId)) return null

  return (
    <div className="p-4">
      <QuestionClient webinarId={webinarId} />
    </div>
  )
}

