'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Star,
  ThumbsUp,
  AlertCircle,
  Clock,
} from 'lucide-react'

/* ================= TYPES ================= */

type FeedbackQuestion = {
  _id: string
  feedbackName: string
  options: string[]
}

/* ================= PAGE ================= */

export default function SubmitFeedbackByUserPage() {
  const params = useParams()
  const webinarId = params?.webinarId as string | undefined

  const [identifier, setIdentifier] = useState('')
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [otherFeedback, setOtherFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  /* ================= LOAD FEEDBACK TEMPLATE ================= */

  useEffect(() => {
    // 🔒 SAFETY: param must exist
    if (!webinarId) {
      setLoading(false)
      return
    }

    const loadFeedback = async () => {
      try {
        setLoading(true)

        const res = await fetch(
          `${process.env.NEXT_PUBLIC__URL}/webinars/${webinarId}/feedback`
        )

        if (!res.ok) throw new Error('Failed to load feedback')

        const json = await res.json()

        // ✅ EXACT mapping based on your  response
        setQuestions(json?.data?.feedbacks || [])
      } catch (err) {
        console.error(err)
        setQuestions([])
      } finally {
        setLoading(false)
      }
    }

    loadFeedback()
  }, [webinarId])

  /* ================= HANDLERS ================= */

  const onSelect = (feedbackId: string, option: string) => {
    if (hasSubmitted) return
    setAnswers((prev) => ({ ...prev, [feedbackId]: option }))
  }

  const allAnswered =
    questions.length > 0 && questions.every((q) => Boolean(answers[q._id]))

  const completionPercentage =
    questions.length > 0
      ? Math.round((Object.keys(answers).length / questions.length) * 100)
      : 0

  const handleSubmit = async () => {
    if (!identifier.trim()) {
      toast.error('Please enter email or mobile')
      return
    }

    if (!allAnswered) {
      toast.error('Please answer all feedback questions')
      return
    }

    try {
      setSubmitting(true)

      const res = await fetch(
        `${process.env.NEXT_PUBLIC__URL}/webinars/${webinarId}/send-feedback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier,
            sendFeedbacks: questions.map((q) => ({
              feedbackId: q._id,
              feedbackName: q.feedbackName,
              selectedOption: answers[q._id],
            })),
            sendOtherFeedback: otherFeedback.trim(),
          }),
        }
      )

      if (!res.ok) throw new Error('Submit failed')

      toast.success('Thank you for your valuable feedback!')
      setHasSubmitted(true)
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  /* ================= INVALID URL ================= */

  if (!webinarId) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Invalid or missing webinar
      </div>
    )
  }

  /* ================= EMPTY ================= */

  if (!questions.length) {
    return (
      <div className="text-center py-12 max-w-2xl mx-auto">
        <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Feedback Questions</h3>
        <p className="text-muted-foreground">
          This webinar doesn't have any feedback questions yet.
        </p>
      </div>
    )
  }

  /* ================= UI ================= */

  return (
    <div className="space-y-8 w-full p-6">
      {/* HEADER */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-semibold text-orange-600 hover:text-orange-700">Webinar Feedback Form</h1>
        <p className="text-muted-foreground">
          Share your experience to help us improve
        </p>
      </div>

      {/* IDENTIFIER INPUT */}
      <Card>
        <CardHeader>
          <CardTitle>Your Details</CardTitle>
          <CardDescription>Enter your email or mobile number</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Email or Mobile"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </CardContent>
      </Card>

      {!hasSubmitted && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">Completion Progress</span>
              <span className="font-bold">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Takes about 2 minutes
            </div>
          </CardContent>
        </Card>
      )}

      {hasSubmitted && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 flex gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="font-bold text-lg text-green-800">
                Feedback Submitted!
              </h3>
              <p className="text-green-700">
                Your feedback has been recorded successfully.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* QUESTIONS */}
      <div className="space-y-6">
        {questions.map((q, idx) => (
          <Card key={q._id} className={hasSubmitted ? 'opacity-90' : ''}>
            <CardHeader>
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                  {idx + 1}
                </div>
                <div>
                  <CardTitle className="text-base">{q.feedbackName}</CardTitle>
                  <CardDescription>
                    Select the option that best matches your experience
                  </CardDescription>
                </div>
                {answers[q._id] && !hasSubmitted && (
                  <Badge className="ml-auto">Answered</Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {q.options.map((opt, i) => {
                const isSelected = answers[q._id] === opt
                const Icon = i === 0 ? Star : i === 1 ? ThumbsUp : AlertCircle

                return (
                  <button
                    key={opt}
                    disabled={hasSubmitted}
                    onClick={() => onSelect(q._id, opt)}
                    className={`flex items-center gap-4 p-4 rounded-lg border text-left ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{opt}</span>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* COMMENTS */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Comments</CardTitle>
          <CardDescription>
            Any additional thoughts or suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={otherFeedback}
            disabled={hasSubmitted}
            onChange={(e) => setOtherFeedback(e.target.value)}
            rows={5}
            className="w-full border rounded-xl p-4"
          />
        </CardContent>
      </Card>

      {!hasSubmitted && (
        <Button
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          size="lg"
          className="w-full gap-2"
        >
          {submitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Submit Feedback
            </>
          )}
        </Button>
      )}
    </div>
  )
}
