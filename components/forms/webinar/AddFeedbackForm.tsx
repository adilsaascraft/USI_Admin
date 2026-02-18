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
  Label,
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
                  const options = watch(`participantFields.${i}.options`) || []

                  // 🔹 Dynamic label placeholders
                  const inputIndex = participantArray.fields.filter(
                    (_, idx) =>
                      idx <= i &&
                      watch(`participantFields.${idx}.type`) === 'input',
                  ).length

                  const checkboxIndex = participantArray.fields.filter(
                    (_, idx) =>
                      idx <= i &&
                      watch(`participantFields.${idx}.type`) === 'checkbox',
                  ).length

                  return (
                    <div key={f.id} className="border p-4 rounded-lg space-y-3">
                      {/* ===== Label + Remove Field ===== */}
                      <Label className='text-sm font-semibold'>Label</Label>
                      <div className="flex gap-2">
                        <FormField
                          control={control}
                          name={`participantFields.${i}.label`}
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder={
                                    type === 'checkbox'
                                      ? `type checkbox label ${checkboxIndex}`
                                      : `type input label ${inputIndex}`
                                  }
                                />
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

                      {/* ===== Checkbox Options ===== */}
                      {type === 'checkbox' && (
                        <div className="pl-6 space-y-2 border-l-2 border-dashed">
                          <Label className='text-sm font-semibold'>Option Label</Label>
                          {options.map((opt: any, oi: number) => (
                            <div key={oi} className="flex gap-2 items-center">
                              <Input
                                placeholder={`Option ${oi + 1}`}
                                value={opt.label}
                                onChange={(e) => {
                                  const updatedOptions = [...options]
                                  updatedOptions[oi] = {
                                    ...updatedOptions[oi],
                                    label: e.target.value,
                                  }

                                  setValue(
                                    `participantFields.${i}.options`,
                                    updatedOptions,
                                    { shouldDirty: true },
                                  )
                                }}
                              />

                              {/* ❌ Remove Option */}
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  const updatedOptions = options.filter(
                                    (_: any, idx: number) => idx !== oi,
                                  )
                                  setValue(
                                    `participantFields.${i}.options`,
                                    updatedOptions,
                                    { shouldDirty: true },
                                  )
                                }}
                              >
                                ✕
                              </Button>
                            </div>
                          ))}

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setValue(
                                `participantFields.${i}.options`,
                                [...options, { label: '' }],
                                { shouldDirty: true },
                              )
                            }
                          >
                            + Add Option
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* ===== Add Fields ===== */}
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

                {feedbackArray.fields.map((section, si) => {
                  const feedbackItems =
                    watch(`feedbacks.${si}.feedbackItems`) || []

                  return (
                    <div
                      key={section.id}
                      className="border p-4 rounded-lg space-y-4 relative"
                    >
                      <Label className='text-sm font-semibold'>Section Label</Label>
                      {/* ===== Section Header ===== */}
                      <div className="flex gap-2 items-center">
                        <FormField
                          control={control}
                          name={`feedbacks.${si}.feedbackLabelName`}
                          render={({ field }) => (
                            <Input
                              {...field}
                              placeholder={`type section label ${si + 1}`}
                            />
                          )}
                        />

                        {/* ❌ Remove Section */}
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          onClick={() => feedbackArray.remove(si)}
                        >
                          ✕
                        </Button>
                      </div>

                      {/* ===== Questions ===== */}
                      {feedbackItems.map((_: any, qi: number) => {
                        const type =
                          watch(
                            `feedbacks.${si}.feedbackItems.${qi}.parameterType`,
                          ) || 'scale'

                        const options =
                          watch(
                            `feedbacks.${si}.feedbackItems.${qi}.options`,
                          ) || []

                        return (
                          <div
                            key={qi}
                            className="border p-3 rounded space-y-3"
                          >
                            <Label className='text-sm font-semibold'>Parameter</Label>
                            {/* Question + Remove */}
                            <div className="flex gap-2 items-center">
                              <Input
                                className="flex-1"
                                placeholder={`type parameter ${qi + 1}`}
                                value={watch(
                                  `feedbacks.${si}.feedbackItems.${qi}.feedbackName`,
                                )}
                                onChange={(e) =>
                                  setValue(
                                    `feedbacks.${si}.feedbackItems.${qi}.feedbackName`,
                                    e.target.value,
                                    { shouldDirty: true },
                                  )
                                }
                              />

                              {/* ❌ Remove Question */}
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  const updatedItems = feedbackItems.filter(
                                    (_: any, idx: number) => idx !== qi,
                                  )

                                  setValue(
                                    `feedbacks.${si}.feedbackItems`,
                                    updatedItems,
                                    { shouldDirty: true },
                                  )
                                }}
                              >
                                ✕
                              </Button>
                            </div>

                            {/* Parameter Type */}
                            <Label className='text-sm font-semibold'>Parameter Scale</Label>
                            <Select
                              value={type}
                              onValueChange={(val) =>
                                onChangeParameterType(
                                  si,
                                  qi,
                                  val as 'scale' | 'yes_no',
                                )
                              }
                            >
                              <SelectTrigger className="w-full p-3">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="scale">
                                  Rating Based (1 to 5)
                                </SelectItem>
                                <SelectItem value="yes_no">
                                  Selection Based (Yes / No)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )
                      })}

                      {/* ===== Add Parameter ===== */}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addFeedbackItem(si)}
                      >
                        + Add Parameter
                      </Button>
                    </div>
                  )
                })}

                {/* ===== Add Feedback Section ===== */}
                <Button
                  type="button"
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
                      type="button"
                      variant="destructive"
                      onClick={() => openEndedArray.remove(i)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
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
                  render={({ field }) => <Textarea rows={4} {...field}
                  placeholder='type closing message' />}
                />
              </div>
            </form>
          </Form>
        </div>
      </FormProvider>

      <div className="sticky bottom-0 border-t px-6 py-4 flex justify-between">
        <SheetClose asChild>
          <Button type="button" variant="outline" disabled={loading}>
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
