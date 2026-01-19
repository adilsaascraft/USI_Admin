'use client'

import { useEffect, useState } from 'react'
import { useFormDraftStore } from '@/stores/useFormDraftStore'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray, FormProvider } from 'react-hook-form'
import { z } from 'zod'

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Input,
  Button,
  SheetClose,
  toast,
} from '@/lib/imports'

import {
  QuestionAnswerSchema,
} from '@/validations/askedQASchema'

/* ================= FORM SCHEMA ================= */

const QnAFormSchema = z.object({
  questionsAndAnswers: z
    .array(QuestionAnswerSchema)
    .min(1, 'At least one question & answer is required'),
})

type QnAFormValues = z.infer<typeof QnAFormSchema>

/* ================= PROPS ================= */

type AddQnAFormProps = {
  webinarId: string
  defaultValues?: Partial<QnAFormValues & { _id: string }>
  qnaId?: string
  onSave?: (data: any) => void
}


/* ================= COMPONENT ================= */

export default function AddQnAForm({
  webinarId,
  defaultValues,
  onSave,
}: AddQnAFormProps) {
  const [loading, setLoading] = useState(false)
  const DRAFT_KEY = 'add-qna-form'
  const { drafts, setDraft, clearDraft } = useFormDraftStore()
  const courseDraft = drafts[DRAFT_KEY]
  const form = useForm<QnAFormValues>({
    resolver: zodResolver(QnAFormSchema),
    defaultValues: defaultValues ||
      courseDraft || {
        questionsAndAnswers: [{ question: '', answer: '' }],
        
      },
  })

  // ================= DRAFT PERSIST =================
  useEffect(() => {
    if (defaultValues?._id) return

    const subscription = form.watch((values) => {
      setDraft(DRAFT_KEY, values)
    })

    return () => subscription.unsubscribe()
  }, [form.watch, defaultValues?._id])

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'questionsAndAnswers',
  })

  /* ================= SUBMIT ================= */

  const onSubmit = async (values: QnAFormValues) => {
    try {
      setLoading(true)

      const method = defaultValues ? 'PUT' : 'POST'

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/webinars/${webinarId}/qna`,
        {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(values),
        }
      )

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Failed to save Q&A')

      toast.success(
        defaultValues ? 'FAQ updated successfully' : 'FAQ created successfully'
      )

      onSave?.(result.data)
      form.reset(values)
      clearDraft(DRAFT_KEY)
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong ❌')
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
            className="flex-1 overflow-y-auto space-y-6 px-4 pb-24"
          >
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-xl p-4 space-y-4">
                {/* QUESTION */}
                <FormField
                  control={form.control}
                  name={`questionsAndAnswers.${index}.question`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter question" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ANSWER */}
                <FormField
                  control={form.control}
                  name={`questionsAndAnswers.${index}.answer`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Answer *</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          rows={4}
                          className="w-full border rounded-lg p-3 text-sm resize-none"
                          placeholder="Enter answer"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* REMOVE */}
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}

            {/* ADD MORE */}
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ question: '', answer: '' })}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              + Add More
            </Button>
          </form>
        </Form>
      </FormProvider>

      {/* FOOTER */}
      <div className="sticky bottom-0 border-t bg-background px-6 py-4 flex justify-between">
        <SheetClose asChild>
          <Button variant="outline" disabled={loading}>
            Close
          </Button>
        </SheetClose>

        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={loading}
          className="bg-orange-600 text-white hover:bg-orange-700"
        >
          {loading
            ? defaultValues
              ? 'Updating...'
              : 'Creating...'
            : defaultValues
            ? 'Update'
            : 'Create'}
        </Button>
      </div>
    </div>
  )
}
