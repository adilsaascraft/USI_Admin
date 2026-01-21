"use client"

import { useParams } from "next/navigation"
import SessionClient from '@/components/clients/conference/SessionClient'

export default function SessionPage() {
  const { conferenceId } = useParams()

  if (!conferenceId || Array.isArray(conferenceId)) return null

  return (
    <div className="p-4">
      <SessionClient conferenceId={conferenceId} />
    </div>
  )
}
