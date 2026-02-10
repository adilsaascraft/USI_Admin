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
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import {
  Send,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { Input } from '@/lib/imports'

/* ================= TYPES ================= */

type ParticipantField = {
  label: string
  type: 'input' | 'checkbox'
  options: { label: string }[]
}

type FeedbackSection = {
  feedbackName: string
  parameterType: 'scale' | 'yes_no'
  options: string[]
}

type OpenEndedItem = {
  label: string
}

type FeedbackDoc = {
  participantFields: ParticipantField[]
  feedbacks: FeedbackSection[]
  openEnded: OpenEndedItem[]
  closeNote?: string
}

/* ================= CONSTANTS ================= */

const SCALE_OPTIONS = [
  { label: 'Poor', value: '1' },
  { label: 'Fair', value: '2' },
  { label: 'Good', value: '3' },
  { label: 'Very Good', value: '4' },
  { label: 'Excellent', value: '5' },
]

/* ================= PAGE ================= */

export default function SubmitFeedbackByUserPage() {
  const params = useParams()
  const webinarId = params?.webinarId as string | undefined

  const [doc, setDoc] = useState<FeedbackDoc | null>(null)

  const [participantAnswers, setParticipantAnswers] = useState<
    Record<string, any>
  >({})
  const [feedbackAnswers, setFeedbackAnswers] = useState<
    Record<string, Record<string, string>>
  >({})
  const [openEndedAnswers, setOpenEndedAnswers] = useState<
    Record<string, string>
  >({})
  const [otherFeedback, setOtherFeedback] = useState('')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  /* ================= LOAD TEMPLATE ================= */

  useEffect(() => {
    if (!webinarId) return

    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/webinars/${webinarId}/feedback`
        )
        const json = await res.json()
        setDoc(json?.data ?? null)
      } catch {
        setDoc(null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [webinarId])

  /* ================= COMPUTED ================= */

  const totalRequired =
    (doc?.feedbacks.length || 0) +
    (doc?.openEnded.length || 0)

  const answeredCount =
    Object.values(feedbackAnswers).reduce(
      (sum, section) => sum + Object.keys(section).length,
      0
    ) + Object.keys(openEndedAnswers).length

  const completion =
    totalRequired > 0
      ? Math.round((answeredCount / totalRequired) * 100)
      : 0

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    if (answeredCount < totalRequired) {
      toast.error('Please complete all questions')
      return
    }

    try {
      setSubmitting(true)

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/webinars/${webinarId}/send-feedback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantAnswers,
            sendFeedbacks: Object.entries(feedbackAnswers).flatMap(
              ([section, values]) =>
                Object.entries(values).map(([q, ans]) => ({
                  feedbackName: section,
                  selectedOption: ans, // 1–5 or Yes/No
                }))
            ),
            sendOtherFeedback: otherFeedback,
            openEndedAnswers,
          }),
        }
      )

      setHasSubmitted(true)
    } catch {
      toast.error('Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Feedback not available
      </div>
    )
  }

  /* ================= SUCCESS SCREEN ================= */

  if (hasSubmitted) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-8 space-y-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
            <h2 className="text-2xl font-semibold text-green-800">
              Feedback Submitted Successfully
            </h2>
            <p className="text-green-700">
              Thank you for taking the time to share your feedback.
            </p>

            {doc.closeNote && (
              <div className="mt-4 text-sm text-muted-foreground whitespace-pre-line">
                {doc.closeNote}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  /* ================= UI ================= */

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-6">

      {/* HEADER */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-orange-600">
          Webinar Feedback Form
        </h1>
        <p className="text-muted-foreground">
          Your feedback helps us improve
        </p>
      </div>
      {/* PARTICIPANT FIELDS */}
      {doc.participantFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Participant Details</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {doc.participantFields.map((f) =>
              f.type === 'input' ? (
                /* INPUT FIELD */
                <Input
                  key={f.label}
                  placeholder={f.label}
                  disabled={hasSubmitted}
                  onChange={(e) =>
                    setParticipantAnswers((prev) => ({
                      ...prev,
                      [f.label]: e.target.value,
                    }))
                  }
                />
              ) : (
                /* CHECKBOX (SINGLE SELECT – ROW) */
                <div key={f.label} className="space-y-2">
                  <p className="font-medium">{f.label}</p>

                  <RadioGroup
                    className="flex flex-wrap gap-6"
                    disabled={hasSubmitted}
                    onValueChange={(val) =>
                      setParticipantAnswers((prev) => ({
                        ...prev,
                        [f.label]: val,
                      }))
                    }
                  >
                    {f.options.map((o) => (
                      <div
                        key={o.label}
                        className="flex items-center gap-2"
                      >
                        <RadioGroupItem
                          value={o.label}
                          id={`${f.label}-${o.label}`}
                        />
                        <label htmlFor={`${f.label}-${o.label}`}>
                          {o.label}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}


      {/* FEEDBACK SECTIONS */}
      {doc.feedbacks.map((section) => (
        <Card key={section.feedbackName}>
          <CardHeader>
            <CardTitle>{section.feedbackName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {section.options.map((q) => (
              <div key={q} className="space-y-2">
                <p className="text-xl font-normal">{q}</p>

                <RadioGroup
                  className="flex flex-wrap gap-6"
                  onValueChange={(val) =>
                    setFeedbackAnswers((prev) => ({
                      ...prev,
                      [section.feedbackName]: {
                        ...(prev[section.feedbackName] || {}),
                        [q]: val,
                      },
                    }))
                  }
                >
                  {(section.parameterType === 'scale'
                    ? SCALE_OPTIONS
                    : [
                      { label: 'Yes', value: 'Yes' },
                      { label: 'No', value: 'No' },
                    ]
                  ).map((opt) => (
                    <div
                      key={opt.value}
                      className="flex items-center gap-2"
                    >
                      <RadioGroupItem
                        value={opt.value}
                        id={`${q}-${opt.value}`}
                      />
                      <label htmlFor={`${q}-${opt.value}`}>
                        {opt.label}
                      </label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* OPEN ENDED */}
      {doc.openEnded.map((q) => (
        <Card key={q.label}>
          <CardHeader>
            <CardTitle>{q.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={4}
              onChange={(e) =>
                setOpenEndedAnswers((p) => ({
                  ...p,
                  [q.label]: e.target.value,
                }))
              }
            />
          </CardContent>
        </Card>
      ))}

      {/* OTHER COMMENTS */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            value={otherFeedback}
            onChange={(e) => setOtherFeedback(e.target.value)}
          />
        </CardContent>
      </Card>

      <Button
        onClick={handleSubmit}
        disabled={submitting}
        size="lg"
        className="w-full gap-2"
      >
        {submitting ? 'Submitting...' : (
          <>
            <Send className="h-4 w-4" />
            Submit Feedback
          </>
        )}
      </Button>
    </div>
  )
}
