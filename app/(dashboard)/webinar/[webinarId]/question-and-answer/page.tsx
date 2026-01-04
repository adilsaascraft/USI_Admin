'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/* ================= TYPES ================= */

type Question = {
  id: string
  author: string
  profile?: string
  text: string
  date?: string
}

/* ================= HELPERS ================= */

function timeAgo(iso?: string) {
  if (!iso) return 'just now'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  return `${days} day ago`
}

function Avatar({ name, profile }: { name: string; profile?: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return profile ? (
    <Image
      src={profile}
      alt={name}
      width={40}
      height={40}
      className="rounded-full object-cover"
    />
  ) : (
    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold">
      {initials}
    </div>
  )
}

/* ================= PAGE ================= */

export default function AllQuestionsPage() {
  const { id: webinarId } = useParams<{ id: string }>()
  const router = useRouter()

  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!webinarId) return

    const fetchQuestions = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/webinars/${webinarId}/questions`
        )

        if (!res.ok) {
          throw new Error('Failed to fetch questions')
        }

        const json = await res.json()

        const mapped: Question[] = json.data.map((q: any) => ({
          id: q._id,
          author: q.userId?.name || 'Anonymous',
          profile: q.userId?.profilePicture,
          text: q.questionName,
          date: q.createdAt,
        }))

        setQuestions(mapped)
      } catch (err) {
        console.error(err)
        setQuestions([])
      } finally {
        setLoading(false) // ✅ IMPORTANT
      }
    }

    fetchQuestions()
  }, [webinarId])

  /* ================= STATES ================= */

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading questions...
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">All Questions</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>

      {questions.length === 0 && (
        <p className="text-muted-foreground">No questions found.</p>
      )}

      {questions.map((q) => (
        <Card key={q.id}>
          <CardContent className="flex gap-4 p-4">
            <Avatar name={q.author} profile={q.profile} />
            <div className="flex-1">
              <p className="font-medium">{q.author}</p>
              <p className="text-xs text-muted-foreground">
                {timeAgo(q.date)}
              </p>
              <p className="mt-2 text-sm">{q.text}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
