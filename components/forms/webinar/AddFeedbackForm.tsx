'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Textarea } from '@/components/ui/textarea'

import { useFormDraftStore } from '@/stores/useFormDraftStore'
import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Button,
  SheetClose,
  toast,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/lib/imports'
import { apiRequest } from '@/lib/apiRequest'

/* ================= CONSTANTS ================= */

const SCALE_LABELS = [
  'Poor',
  'Fair',
  'Good',
  'Very Good',
  'Excellent',
]

const YES_NO_LABELS = ['Yes', 'No']

/* ================= SCHEMA ================= */

const CheckboxOptionSchema = z.object({
  label: z.string().optional(),
})

const ParticipantFieldSchema = z.object({
  label: z.string().optional(),
  type: z.enum(['input', 'checkbox']),
  options: z.array(CheckboxOptionSchema).optional(),
})

const FeedbackQuestionSchema = z.object({
  feedbackName: z.string().optional(),
  parameterType: z.enum(['scale', 'yes_no']),
  options: z.array(z.string()),
})

const FeedbackSectionSchema = z.object({
  feedbackLabelName: z.string().optional(),
  feedbackItems: z.array(FeedbackQuestionSchema),
})

const OpenEndedSchema = z.object({
  label: z.string().optional(),
})

const FeedbackFormSchema = z.object({
  participantFields: z.array(ParticipantFieldSchema),
  feedbacks: z.array(FeedbackSectionSchema),
  openEnded: z.array(OpenEndedSchema),
  closeNote: z.string().optional(),
})

type FeedbackFormValues = z.infer<typeof FeedbackFormSchema>

/* ================= COMPONENT ================= */

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
        feedbacks: [
          {
            feedbackLabelName: '',
            feedbackItems: [
              {
                feedbackName: '',
                parameterType: 'scale',
                options: SCALE_LABELS,
              },
            ],
          },
        ],
        openEnded: [{ label: '' }],
        closeNote: '',
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

  const participantArray = useFieldArray({
    control,
    name: 'participantFields',
  })

  const feedbackArray = useFieldArray({
    control,
    name: 'feedbacks',
  })

  const openEndedArray = useFieldArray({
    control,
    name: 'openEnded',
  })

  /* ================= HELPERS ================= */

  const addCheckboxOption = (index: number) => {
    const current = watch(`participantFields.${index}.options`) || []
    setValue(`participantFields.${index}.options`, [
      ...current,
      { label: '' },
    ])
  }

  const addFeedbackItem = (sectionIndex: number) => {
    const current =
      watch(`feedbacks.${sectionIndex}.feedbackItems`) || []

    setValue(`feedbacks.${sectionIndex}.feedbackItems`, [
      ...current,
      {
        feedbackName: '',
        parameterType: 'scale',
        options: SCALE_LABELS,
      },
    ])
  }

  const onChangeParameterType = (
    sectionIndex: number,
    itemIndex: number,
    type: 'scale' | 'yes_no'
  ) => {
    setValue(
      `feedbacks.${sectionIndex}.feedbackItems.${itemIndex}.parameterType`,
      type
    )

    setValue(
      `feedbacks.${sectionIndex}.feedbackItems.${itemIndex}.options`,
      type === 'scale' ? SCALE_LABELS : YES_NO_LABELS
    )
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
    } catch (e: any) {
      toast.error(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  /* ================= UI ================= */

  return (
    <div className="flex flex-col min-h-full">
      <FormProvider {...form}>
        <div className="flex-1 overflow-y-auto mb-20 px-3">
          <Form {...form}>
            <form
              id="add-feedback-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >

              {/* ================= SECTION A ================= */}
              <div className="border p-4 rounded-xl space-y-4">
                <h3 className="font-semibold">Participant Details</h3>

                {participantArray.fields.map((f, i) => {
                  const type = watch(`participantFields.${i}.type`)
                  return (
                    <div key={f.id} className="border p-4 rounded-lg space-y-3">
                      <div className="flex gap-2">
                        <FormField
                          control={control}
                          name={`participantFields.${i}.label`}
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormControl>
                                <Input {...field} placeholder="Field Label" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => participantArray.remove(i)}
                        >
                          ✕
                        </Button>
                      </div>

                      {type === 'checkbox' && (
                        <div className="pl-6 space-y-2 border-l-2 border-dashed">
                          {(watch(`participantFields.${i}.options`) || []).map(
                            (_, oi: number) => (
                              <Input
                                key={oi}
                                placeholder={`Option ${oi + 1}`}
                                onChange={(e) => {
                                  const arr =
                                    watch(
                                      `participantFields.${i}.options`
                                    ) || []
                                  arr[oi].label = e.target.value
                                  setValue(
                                    `participantFields.${i}.options`,
                                    arr
                                  )
                                }}
                              />
                            )
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addCheckboxOption(i)}
                          >
                            + Add Option
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      participantArray.append({ label: '', type: 'input' })
                    }
                  >
                    + Input
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      participantArray.append({
                        label: '',
                        type: 'checkbox',
                        options: [{ label: '' }],
                      })
                    }
                  >
                    + Checkbox
                  </Button>
                </div>
              </div>

              {/* ================= SECTION B ================= */}
              <div className="border p-4 rounded-xl space-y-4">
                <h3 className="font-semibold">Section Label & Parameters</h3>

                {feedbackArray.fields.map((section, si) => (
                  <div key={section.id} className="border p-4 rounded-lg space-y-4">
                    <FormField
                      control={control}
                      name={`feedbacks.${si}.feedbackLabelName`}
                      render={({ field }) => (
                        <Input {...field} placeholder="Section Label" />
                      )}
                    />

                    {(watch(`feedbacks.${si}.feedbackItems`) || []).map(
                      (_: any, qi: number) => {
                        const type =
                          watch(
                            `feedbacks.${si}.feedbackItems.${qi}.parameterType`
                          ) || 'scale'

                        const options =
                          watch(
                            `feedbacks.${si}.feedbackItems.${qi}.options`
                          ) || []

                        return (
                          <div key={qi} className="border p-3 rounded space-y-3">
                            <Input
                              placeholder="Question"
                              onChange={(e) =>
                                setValue(
                                  `feedbacks.${si}.feedbackItems.${qi}.feedbackName`,
                                  e.target.value
                                )
                              }
                            />

                            <Select
                              value={type}
                              onValueChange={(val) =>
                                onChangeParameterType(
                                  si,
                                  qi,
                                  val as 'scale' | 'yes_no'
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="scale">
                                  Scale (1–5)
                                </SelectItem>
                                <SelectItem value="yes_no">
                                  Yes / No
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            {options.map((opt: string, oi: number) => (
                              <Input
                                key={oi}
                                value={opt}
                                disabled
                                className="bg-muted"
                              />
                            ))}
                          </div>
                        )
                      }
                    )}

                    <Button
                      variant="outline"
                      onClick={() => addFeedbackItem(si)}
                    >
                      + Add Question
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={() =>
                    feedbackArray.append({
                      feedbackLabelName: '',
                      feedbackItems: [
                        {
                          feedbackName: '',
                          parameterType: 'scale',
                          options: SCALE_LABELS,
                        },
                      ],
                    })
                  }
                >
                  + Add Feedback Section
                </Button>
              </div>

              {/* ================= SECTION C ================= */}
              <div className="border p-4 rounded-xl space-y-4">
                <h3 className="font-semibold">Open-ended Feedback</h3>
                {openEndedArray.fields.map((f, i) => (
                  <div key={f.id} className="flex gap-2">
                    <FormField
                      control={control}
                      name={`openEnded.${i}.label`}
                      render={({ field }) => (
                        <Input {...field} placeholder="Question" />
                      )}
                    />
                    <Button
                      variant="destructive"
                      onClick={() => openEndedArray.remove(i)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => openEndedArray.append({ label: '' })}
                >
                  + Add Question
                </Button>
              </div>

              {/* ================= CLOSE NOTE ================= */}
              <div className="border p-4 rounded-xl space-y-4">
                <h3 className="font-semibold">Closing Message</h3>
                <FormField
                  control={control}
                  name="closeNote"
                  render={({ field }) => (
                    <Textarea rows={4} {...field} />
                  )}
                />
              </div>
            </form>
          </Form>
        </div>
      </FormProvider>

      <div className="sticky bottom-0 border-t px-6 py-4 flex justify-between">
        <SheetClose asChild>
          <Button variant="outline" disabled={loading}>
            Close
          </Button>
        </SheetClose>
        <Button
          type="submit"
          form="add-feedback-form"
          disabled={loading}
          className="bg-orange-600 text-white"
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
