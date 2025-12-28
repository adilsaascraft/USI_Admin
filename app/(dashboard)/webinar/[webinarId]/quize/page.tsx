
"use client";

import { useParams } from "next/navigation";
import QuizClient from '@/components/clients/webinar/QuizClient'

export default function QuizPage() {
  const { webinarId } = useParams()
  if (!webinarId || Array.isArray(webinarId)) return null

  return (
    <div className="p-4">
      <QuizClient webinarId={webinarId} />
    </div>
  )
}

