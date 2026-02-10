'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Textarea } from "@/components/ui/textarea";
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
} from '@/lib/imports'
import { apiRequest } from '@/lib/apiRequest'

/* =====================================================
  SCHEMA (ADMIN BUILDER – LOOSE)
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
        feedbacks: [{ feedbackName: '', options: [''] }],
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
    setValue(`participantFields.${index}.options`, [...current, { label: '' }])
  }

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
    } catch (e: any) {
      toast.error(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  /* ================= UI ================= */

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 overflow-y-auto custom-scroll mb-20">
        <Form {...form}>
          <form id="add-feedback-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-3">

            {/* ================= SECTION A ================= */}
            <div className="border p-4 rounded-xl space-y-4">
              <h3 className="font-semibold">Section A: Participant Details</h3>

              {participantArray.fields.map((f, i) => (
                <div key={f.id} className="space-y-2">
                  <div className="flex gap-2">
                    <FormField
                      control={control}
                      name={`participantFields.${i}.label`}
                      render={({ field }) => (
                        <Input {...field} placeholder="Field label" />
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

                  {watch(`participantFields.${i}.type`) === 'checkbox' &&
                    (watch(`participantFields.${i}.options`) || []).map(
                      (_: any, oi: number) => (
                        <div key={oi} className="flex gap-2 ml-6">
                          <FormField
                            control={control}
                            name={`participantFields.${i}.options.${oi}.label`}
                            render={({ field }) => (
                              <Input {...field} placeholder="Checkbox option" />
                            )}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                              const arr =
                                watch(`participantFields.${i}.options`) || []
                              setValue(
                                `participantFields.${i}.options`,
                                arr.filter((_: any, x: number) => x !== oi)
                              )
                            }}
                          >
                            ✕
                          </Button>
                        </div>
                      )
                    )}

                  {watch(`participantFields.${i}.type`) === 'checkbox' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addCheckboxOption(i)}
                      className="ml-6"
                    >
                      + Option
                    </Button>
                  )}
                </div>
              ))}

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
              <h3 className="font-semibold">Feedback Name & Parameters</h3>

              {feedbackArray.fields.map((f, i) => (
                <div key={f.id} className="space-y-2 border p-3 rounded">
                  <div className="flex gap-2">
                    <FormField
                      control={control}
                      name={`feedbacks.${i}.feedbackName`}
                      render={({ field }) => (
                        <Input {...field} placeholder="Feedback Name" />
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

                  {(watch(`feedbacks.${i}.options`) || []).map(
                    (_: any, oi: number) => (
                      <div key={oi} className="flex gap-2">
                        <FormField
                          control={control}
                          name={`feedbacks.${i}.options.${oi}`}
                          render={({ field }) => (
                            <Input {...field} placeholder="Parameter" />
                          )}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => {
                            const arr = watch(`feedbacks.${i}.options`) || []
                            setValue(
                              `feedbacks.${i}.options`,
                              arr.filter((_: any, x: number) => x !== oi)
                            )
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    )
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addFeedbackOption(i)}
                  >
                    + Parameter
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  feedbackArray.append({ feedbackName: '', options: [''] })
                }
              >
                + Add Feedback
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

            {/* Close Note */}
            <FormField
              control={form.control}
              name="closeNote"
              render={({ field }) => (
                <FormItem className="space-y-2 mt-6">
                  <FormLabel>Feedback Close Note</FormLabel>
                  <FormControl>
                    <Textarea
                      className="w-full rounded-md border px-3 py-2"
                      placeholder="type feedback close note"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>

     {/* Footer */}
      <div className="sticky bottom-0 left-0 right-0 border-t px-6 py-4 flex justify-between">
        <SheetClose asChild>
          <Button type="button" variant="outline" className="border border-gray-400" disabled={loading}>
            Close
          </Button>
        </SheetClose>

        <Button
          type="submit"
          form="add-feedback-form"
          disabled={loading}
          className="bg-orange-600 text-white hover:bg-sky-700"
        >
          {loading
            ? defaultValues?._id
              ? "Updating..."
              : "Creating..."
            : defaultValues?._id
              ? "Update"
              : "Create"}
        </Button>
      </div>
    </div>
  )
}
