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

/* =====================================================
  SCHEMA (ADMIN BUILDER – LOOSE & CORRECT)
===================================================== */

const CheckboxOptionSchema = z.object({
  label: z.string().optional(),
})

const ParticipantFieldSchema = z.object({
  label: z.string().optional(),
  type: z.enum(['input', 'checkbox']),
  options: z.array(CheckboxOptionSchema).optional(),
})

const FeedbackItemSchema = z.object({
  feedbackName: z.string().optional(),
  parameterType: z.enum(['scale', 'yes_no']).optional(),
  options: z.array(z.string().optional()),
})

const OpenEndedSchema = z.object({
  label: z.string().optional(),
})

const FeedbackFormSchema = z.object({
  participantFields: z.array(ParticipantFieldSchema),
  feedbacks: z.array(FeedbackItemSchema),
  openEnded: z.array(OpenEndedSchema),
  closeNote: z.string().optional(),
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
        feedbacks: [
          { feedbackName: '', parameterType: 'scale', options: [''] },
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

  const addFeedbackOption = (index: number) => {
    const current = watch(`feedbacks.${index}.options`) || []
    setValue(`feedbacks.${index}.options`, [...current, ''])
  }

  const onChangeParameterType = (
    index: number,
    type: 'scale' | 'yes_no'
  ) => {
    setValue(`feedbacks.${index}.parameterType`, type)

    const current = watch(`feedbacks.${index}.options`) || []

    // Ensure at least one parameter exists
    if (current.length === 0) {
      setValue(`feedbacks.${index}.options`, [''])
    }
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
        <div className="flex-1 overflow-y-auto custom-scroll mb-20">
          <Form {...form}>
            <form
              id="add-feedback-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 px-3"
            >

              {/* ================= SECTION A ================= */}
              <div className="border p-4 rounded-xl space-y-4">
                <h3 className="font-semibold">
                  Participant Details
                </h3>

                {participantArray.fields.map((f, i) => {
                  const type = watch(`participantFields.${i}.type`)

                  return (
                    <div
                      key={f.id}
                      className="border rounded-lg p-4 space-y-3 bg-muted/30"
                    >
                      <div className="flex gap-2 items-start">
                        <FormField
                          control={control}
                          name={`participantFields.${i}.label`}
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel>
                                {type === 'checkbox'
                                  ? 'Checkbox Label'
                                  : 'Input Label'}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder={
                                    type === 'checkbox'
                                      ? 'e.g. Designation'
                                      : 'e.g. Name, Institution, City'
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => participantArray.remove(i)}
                          className="mt-6"
                        >
                          ✕
                        </Button>
                      </div>

                      {type === 'checkbox' && (
                        <div className="space-y-2 pl-6 border-l-2 border-dashed">
                          {(watch(
                            `participantFields.${i}.options`
                          ) || []).map((_, oi: number) => (
                            <div key={oi} className="flex gap-2">
                              <FormField
                                control={control}
                                name={`participantFields.${i}.options.${oi}.label`}
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    placeholder={`Option ${oi + 1}`}
                                  />
                                )}
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={() => {
                                  const arr =
                                    watch(
                                      `participantFields.${i}.options`
                                    ) || []
                                  setValue(
                                    `participantFields.${i}.options`,
                                    arr.filter(
                                      (_: any, x: number) => x !== oi
                                    )
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
                            onClick={() => addCheckboxOption(i)}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
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
                    type="button"
                    variant="outline"
                    onClick={() =>
                      participantArray.append({
                        label: '',
                        type: 'input',
                      })
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

                {feedbackArray.fields.map((f, i) => {
                  const type =
                    watch(`feedbacks.${i}.parameterType`) || 'scale'
                  const options = watch(`feedbacks.${i}.options`) || []

                  return (
                    <div
                      key={f.id}
                      className="space-y-4 border p-4 rounded-lg"
                    >
                      {/* SECTION LABEL + REMOVE */}
                      <div className="flex gap-2 items-start">
                        <FormField
                          control={control}
                          name={`feedbacks.${i}.feedbackName`}
                          render={({ field }) => (
                            <Input
                              {...field}
                              placeholder="Section Label e.g. Virtual Platform Experience"
                            />
                          )}
                        />

                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => feedbackArray.remove(i)}
                        >
                          ✕
                        </Button>
                      </div>

                      {/* PARAMETER TYPE (SHADCN SELECT) */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium">
                          Parameter Type
                        </label>

                        <Select
                          value={type}
                          onValueChange={(val) =>
                            onChangeParameterType(
                              i,
                              val as 'scale' | 'yes_no'
                            )
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select parameter type" />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="scale">
                              Scale Based (1 to 5)
                            </SelectItem>
                            <SelectItem value="yes_no">
                              Yes / No Based
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* PARAMETERS */}
                      <div className="space-y-2">
                        {options.map((_, oi: number) => (
                          <div key={oi} className="flex gap-2">
                            <FormField
                              control={control}
                              name={`feedbacks.${i}.options.${oi}`}
                              render={({ field }) => (
                                <Input
                                  {...field}
                                  placeholder={
                                    type === 'yes_no'
                                      ? 'e.g. Would you like to attend similar USI virtual programs in the future?'
                                      : `Parameter ${oi + 1}`
                                  }
                                />
                              )}
                            />

                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => {
                                const arr =
                                  watch(`feedbacks.${i}.options`) || []
                                setValue(
                                  `feedbacks.${i}.options`,
                                  arr.filter(
                                    (_: any, x: number) => x !== oi
                                  )
                                )
                              }}
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                      </div>

                      {/* ADD PARAMETER (BOTH TYPES) */}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addFeedbackOption(i)}
                      >
                        + Add Parameter
                      </Button>
                    </div>
                  )
                })}

                {/* ADD FEEDBACK */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    feedbackArray.append({
                      feedbackName: '',
                      parameterType: 'scale',
                      options: [''],
                    })
                  }
                >
                  + Add Feedback
                </Button>
              </div>


              {/* ================= SECTION C ================= */}
              <div className="border p-4 rounded-xl space-y-4">
                <h3 className="font-semibold">
                  Open-ended Feedback
                </h3>

                {openEndedArray.fields.map((f, i) => (
                  <div key={f.id} className="flex gap-2">
                    <FormField
                      control={control}
                      name={`openEnded.${i}.label`}
                      render={({ field }) => (
                        <Input {...field} placeholder="What did you like most about the program?" />
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
                  onClick={() =>
                    openEndedArray.append({ label: '' })
                  }
                >
                  + Add Question
                </Button>
              </div>

              {/* ================= CLOSE NOTE ================= */}
              <div className="border p-4 rounded-xl space-y-4">
                <h3 className="font-semibold">
                  Closing Mesage
                </h3>
                <FormField
                  control={control}
                  name="closeNote"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Feedback Close Note</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder="Type feedback close note"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>
      </FormProvider>

      {/* ================= FOOTER ================= */}
      <div className="sticky bottom-0 border-t px-6 py-4 flex justify-between">
        <SheetClose asChild>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
          >
            Close
          </Button>
        </SheetClose>

        <Button
          type="submit"
          form="add-feedback-form"
          disabled={loading}
          className="bg-orange-600 text-white hover:bg-orange-700"
        >
          {loading
            ? defaultValues?._id
              ? 'Updating...'
              : 'Creating...'
            : defaultValues?._id
              ? 'Update'
              : 'Create'}
        </Button>
      </div>
    </div>
  )
}
