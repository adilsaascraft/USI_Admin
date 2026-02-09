'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { useFormDraftStore } from '@/stores/useFormDraftStore'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  Input,
  Button,
  SheetClose,
  toast,
} from '@/lib/imports'
import { apiRequest } from '@/lib/apiRequest'

/* =====================================================
  SCHEMA (ADMIN BUILDER – MOSTLY OPTIONAL)
===================================================== */

const ParticipantFieldSchema = z.object({
  label: z.string().optional(),
  type: z.enum(['input', 'checkbox']),
})

const FeedbackItemSchema = z.object({
  feedbackName: z.string().optional(),
  options: z.array(z.string().optional()).optional(),
})

const FeedbackFormSchema = z.object({
  participantFields: z.array(ParticipantFieldSchema).optional(),
  feedbacks: z.array(FeedbackItemSchema).optional(),
  openEnded: z.array(z.string().optional()).optional(),
})

type FeedbackFormValues = z.infer<typeof FeedbackFormSchema>

/* =====================================================
  COMPONENT
===================================================== */

export default function AddFeedbackForm({
  webinarId,
  defaultValues,
  onSave,
}: {
  webinarId: string
  defaultValues?: Partial<FeedbackFormValues & { _id: string }>
  onSave?: () => void
}) {
  const [loading, setLoading] = useState(false)
  const DRAFT_KEY = 'add-feedback-form'

  const { drafts, setDraft, clearDraft } = useFormDraftStore()
  const draft = drafts[DRAFT_KEY]

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(FeedbackFormSchema),
    defaultValues:
      defaultValues ||
      draft || {
        participantFields: [],
        feedbacks: [{ feedbackName: '', options: [''] }],
        openEnded: [''],
      },
  })

  const { control, watch, setValue } = form

  /* ================= DRAFT ================= */

  useEffect(() => {
    if (defaultValues?._id) return
    const sub = form.watch((values) => setDraft(DRAFT_KEY, values))
    return () => sub.unsubscribe()
  }, [form, defaultValues?._id])

  /* ================= FIELD ARRAYS ================= */

  // 1️⃣ Participant Details
  const participantArray = useFieldArray({
    control,
    name: 'participantFields',
  })

  // 2️⃣ Feedback Parameters
  const feedbackArray = useFieldArray({
    control,
    name: 'feedbacks',
  })

  // 3️⃣ Open-ended
  const openEndedArray = useFieldArray({
    control,
    name: 'openEnded',
  })

  /* ================= HELPERS ================= */

  const addFeedbackOption = (i: number) => {
    const current = watch(`feedbacks.${i}.options`) || []
    setValue(`feedbacks.${i}.options`, [...current, ''])
  }

  /* ================= SUBMIT ================= */

  const onSubmit = async (values: FeedbackFormValues) => {
    if (loading) return

    try {
      setLoading(true)

      await apiRequest({
        endpoint: `/api/webinars/${webinarId}/feedback`,
        method: defaultValues ? 'PUT' : 'POST',
        body: values,
        showToast: false,
      })

      toast.success('Feedback form saved')
      clearDraft(DRAFT_KEY)
      onSave?.()
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  /* ================= UI ================= */

  return (
    <div className="flex flex-col min-h-full">
      <FormProvider {...form}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto space-y-8 px-4 pb-28"
          >
            {/* =====================================================
              SECTION A – PARTICIPANT DETAILS
            ===================================================== */}
            <div className="border rounded-xl p-4 space-y-4">
              <h3 className="font-semibold">
                Section A: Participant Details
              </h3>

              {participantArray.fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <FormField
                    control={control}
                    name={`participantFields.${index}.label`}
                    render={({ field }) => (
                      <Input {...field} placeholder="Field label" />
                    )}
                  />

                  <span className="text-sm text-muted-foreground self-center">
                    ({watch(`participantFields.${index}.type`)})
                  </span>
                </div>
              ))}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    participantArray.append({ label: '', type: 'input' })
                  }
                >
                  + Input
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    participantArray.append({ label: '', type: 'checkbox' })
                  }
                >
                  + Checkbox
                </Button>
              </div>
            </div>

            {/* =====================================================
              SECTION B – FEEDBACK PARAMETERS (OLD CODE STYLE)
            ===================================================== */}
            <div className="border rounded-xl p-4 space-y-4">
              <h3 className="font-semibold">Feedback Name & Parameters</h3>

              {feedbackArray.fields.map((field, index) => (
                <div key={field.id} className="space-y-2">
                  <FormField
                    control={control}
                    name={`feedbacks.${index}.feedbackName`}
                    render={({ field }) => (
                      <Input {...field} placeholder="Feedback Name" />
                    )}
                  />

                  {(watch(`feedbacks.${index}.options`) || []).map(
                    (_: any, optIndex: number) => (
                      <div key={optIndex} className="flex gap-2">
                        <FormField
                          control={control}
                          name={`feedbacks.${index}.options.${optIndex}`}
                          render={({ field }) => (
                            <Input {...field} placeholder="Parameter" />
                          )}
                        />

                        {optIndex ===
                          watch(`feedbacks.${index}.options`)?.length - 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => addFeedbackOption(index)}
                          >
                            +
                          </Button>
                        )}
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>

            {/* =====================================================
              SECTION C – OPEN ENDED FEEDBACK
            ===================================================== */}
            <div className="border rounded-xl p-4 space-y-4">
              <h3 className="font-semibold">Open-ended Feedback</h3>

              {openEndedArray.fields.map((field, index) => (
                <FormField
                  key={field.id}
                  control={control}
                  name={`openEnded.${index}`}
                  render={({ field }) => (
                    <Input {...field} placeholder="Question" />
                  )}
                />
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => openEndedArray.append('')}
              >
                + Add Question
              </Button>
            </div>
          </form>
        </Form>
      </FormProvider>

      {/* ================= FOOTER ================= */}

      <div className="sticky bottom-0 border-t bg-background px-6 py-4 flex justify-between">
        <SheetClose asChild>
          <Button variant="outline">Close</Button>
        </SheetClose>

        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={loading}
          className="bg-orange-600 text-white"
        >
          {loading ? 'Saving...' : 'Save Form'}
        </Button>
      </div>
    </div>
  )
}
