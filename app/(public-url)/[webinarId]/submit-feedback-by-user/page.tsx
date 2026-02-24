'use client'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { Send, CheckCircle2 } from 'lucide-react'
import { Input } from '@/lib/imports'

/* ================= TYPES ================= */

type ParticipantField = {
  label: string
  type: 'input' | 'checkbox'
  options: { label: string }[]
}

type FeedbackItem = {
  feedbackName: string
  parameterType: 'scale' | 'yes_no'
  options: string[]
}

type FeedbackSection = {
  feedbackLabelName: string
  feedbackItems: FeedbackItem[]
}

type OpenEndedItem = {
  label: string
}

type WebinarInfo = {
  name: string
  webinarType: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  timeZone: string
}

type FeedbackDoc = {
  participantFields: ParticipantField[]
  feedbacks: FeedbackSection[]
  openEnded: OpenEndedItem[]
  closeNote?: string
  webinarId: WebinarInfo
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
  const router = useRouter()
const [countdown, setCountdown] = useState(10)

  const [doc, setDoc] = useState<FeedbackDoc | null>(null)
  const [participantAnswers, setParticipantAnswers] =
    useState<Record<string, any>>({})
  const [feedbackAnswers, setFeedbackAnswers] =
    useState<Record<string, Record<string, string>>>({})
  const [openEndedAnswers, setOpenEndedAnswers] =
    useState<Record<string, string>>({})
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

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    try {
      setSubmitting(true)

      /* ================= TRANSFORM PARTICIPANT ================= */
      const formattedParticipantAnswers = Object.entries(
        participantAnswers
      ).map(([label, answer]) => ({
        label,
        answer,
      }))

      /* ================= TRANSFORM FEEDBACK ================= */
      const formattedFeedbacks = Object.entries(
        feedbackAnswers
      ).map(([feedbackLabelName, questions]) => ({
        feedbackLabelName,
        answers: Object.entries(questions).map(
          ([feedbackName, answer]) => ({
            feedbackName,
            answer,
          })
        ),
      }))

      /* ================= TRANSFORM OPEN ENDED ================= */
      const formattedOpenEnded = Object.entries(
        openEndedAnswers
      ).map(([label, answer]) => ({
        label,
        answer,
      }))

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/webinars/${webinarId}/public-feedback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantAnswers: formattedParticipantAnswers,
            sendFeedbacks: formattedFeedbacks,
            openEndedAnswers: formattedOpenEnded,
            sendOtherFeedback: otherFeedback,
          }),
        }
      )

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.message || 'Submission failed')
      }

      toast.success(json.message || 'Feedback submitted successfully')
      setHasSubmitted(true)
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }


  useEffect(() => {
  if (!hasSubmitted) return

  setCountdown(10)

  const interval = setInterval(() => {
    setCountdown((prev) => {
      if (prev <= 1) {
        clearInterval(interval)
        window.location.href = 'https://elearning.usi.org.in/mylearning'
        return 0
      }
      return prev - 1
    })
  }, 1000)

  return () => clearInterval(interval)
}, [hasSubmitted])

const handleManualRedirect = () => {
  window.location.href = 'https://elearning.usi.org.in/mylearning'
}


  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-6">
        <Skeleton className="h-32 w-full" />
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

  const w = doc.webinarId

  /* ================= SUCCESS ================= */
if (hasSubmitted) {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-8 space-y-6 text-center">
          <CheckCircle2 className="h-14 w-14 text-green-600 mx-auto" />

          <h2 className="text-2xl font-semibold text-green-800">
            Feedback Submitted Successfully
          </h2>

          {doc.closeNote && (
            <p className="text-sm whitespace-pre-line">
              {doc.closeNote}
            </p>
          )}

          <p className="text-sm text-muted-foreground">
            You will be redirected to your learning dashboard in{' '}
            <span className="font-semibold text-orange-600">
              {countdown}
            </span>{' '}
            seconds.
          </p>

          <Button
            size="lg"
            className="bg-orange-600 hover:bg-orange-700 text-white"
            onClick={handleManualRedirect}
          >
            Go To My Learning
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

  /* ================= UI ================= */

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-6">

      {/* ===== WEBINAR INFO CARD ===== */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6 space-y-3 text-center">
          <h1 className="text-2xl font-bold text-orange-700">
            {w.name}
          </h1>

          <p className="text-sm text-muted-foreground">
            {w.startDate} – {w.startTime} || {w.endDate}   – {w.endTime} (IST)
          </p>

          <p className="font-medium">
            <b className='text-muted-foreground'>{w.webinarType} – Participant Feedback Form</b>
          </p>

          <p className="text-sm text-muted-foreground">
            Urological Society of India – Virtual Educational Activity
          </p>

          <p className="text-sm leading-relaxed">
            Thank you for participating in the <b>{w.webinarType}</b>.
            Your feedback is valuable in helping us improve future USI
            educational initiatives.
          </p>
        </CardContent>
      </Card>

      {/* PARTICIPANT DETAILS */}
      {doc.participantFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Participant Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {doc.participantFields.map((f) =>
              f.type === 'input' ? (
                <Input
                  key={f.label}
                  placeholder={f.label}
                  onChange={(e) =>
                    setParticipantAnswers((p) => ({
                      ...p,
                      [f.label]: e.target.value,
                    }))
                  }
                />
              ) : (
                <div key={f.label} className="space-y-2">
                  <p className="text-sm font-semibold">{f.label}</p>
                  <RadioGroup
                    className="flex flex-wrap gap-6"
                    onValueChange={(val) =>
                      setParticipantAnswers((p) => ({
                        ...p,
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
        <Card key={section.feedbackLabelName}>
          <CardHeader>
            <CardTitle>{section.feedbackLabelName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {section.feedbackItems.map((item) => (
              <div key={item.feedbackName} className="space-y-2">
                <p className="text-sm font-semibold">
                  {item.feedbackName}
                </p>
                <RadioGroup
                  className="flex flex-wrap gap-6"
                  onValueChange={(val) =>
                    setFeedbackAnswers((prev) => ({
                      ...prev,
                      [section.feedbackLabelName]: {
                        ...(prev[section.feedbackLabelName] || {}),
                        [item.feedbackName]: val,
                      },
                    }))
                  }
                >
                  {(item.parameterType === 'scale'
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
                        id={`${item.feedbackName}-${opt.value}`}
                      />
                      <label htmlFor={`${item.feedbackName}-${opt.value}`}>
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
              placeholder="Type your response..."
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
            placeholder='Type your response...'
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
        {submitting ? (
          'Submitting...'
        ) : (
          <>
            <Send className="h-4 w-4" />
            Submit Feedback
          </>
        )}
      </Button>

    </div>
  )
}
