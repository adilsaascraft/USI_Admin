'use client'

import { useState } from 'react'
import { useForm, useFieldArray, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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

/* ================= SCHEMA ================= */

const FeedbackItemSchema = z.object({
  feedbackName: z.string().min(1, 'Feedback name is required'),
  options: z.array(z.string().min(1)).min(1),
})

const FeedbackFormSchema = z.object({
  feedbacks: z.array(FeedbackItemSchema).min(1),
})

type FeedbackFormValues = z.infer<typeof FeedbackFormSchema>

/* ================= COMPONENT ================= */

export default function AddFeedbackForm({
  webinarId,
  defaultValues,
  onSave,
}: {
  webinarId: string
  defaultValues?: FeedbackFormValues
  onSave?: () => void
}) {
  const [loading, setLoading] = useState(false)

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(FeedbackFormSchema),
    defaultValues: defaultValues ?? {
      feedbacks: [
        {
          feedbackName: '',
          options: [''], // 🔴 REQUIRED
        },
      ],
    },
  })

  const { control, watch, setValue } = form

  /* ✅ ONLY ONE useFieldArray (TOP LEVEL) */
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'feedbacks',
  })

  const feedbacks = watch('feedbacks')

  /* ================= HELPERS ================= */

  const addOption = (i: number) => {
    const updated = [...feedbacks[i].options, '']
    setValue(`feedbacks.${i}.options`, updated)
  }

  const removeOption = (i: number, j: number) => {
    const updated = feedbacks[i].options.filter((_, idx) => idx !== j)
    setValue(`feedbacks.${i}.options`, updated)
  }

  /* ================= SUBMIT ================= */

  const onSubmit = async (values: FeedbackFormValues) => {
    try {
      setLoading(true)

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/webinars/${webinarId}/feedback`,
        {
          method: defaultValues ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(values),
        }
      )

      const json = await res.json()
      if (!res.ok) throw new Error(json.message)

      toast.success(defaultValues ? 'Feedback updated' : 'Feedback created')
      onSave?.()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  /* ================= UI ================= */

  return (
    <div className='overflow-auto'>
      <FormProvider {...form}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 px-4"
          >
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-xl p-4 space-y-4">
                {/* FEEDBACK NAME */}
                <FormField
                  control={control}
                  name={`feedbacks.${index}.feedbackName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feedback Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* OPTIONS */}
                <div className="space-y-2">
                  <FormLabel>Options *</FormLabel>

                  {feedbacks[index].options.map((_, optIndex) => (
                    <div key={optIndex} className="flex gap-2">
                      <FormField
                        control={control}
                        name={`feedbacks.${index}.options.${optIndex}`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input {...field} placeholder="Option" />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* ADD OPTION */}
                      {optIndex === feedbacks[index].options.length - 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addOption(index)}
                        >
                          +
                        </Button>
                      )}

                      {/* REMOVE OPTION */}
                      {feedbacks[index].options.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => removeOption(index, optIndex)}
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* REMOVE FEEDBACK */}
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    Remove Feedback
                  </Button>
                )}
              </div>
            ))}

            {/* ADD MORE FEEDBACK */}
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ feedbackName: '', options: [''] })}
            >
              + Add More
            </Button>

            {/* FOOTER */}
            <div className="sticky bottom-0 bg-background border-t py-4 flex justify-between">
              <SheetClose asChild>
                <Button variant="outline">Close</Button>
              </SheetClose>

              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : defaultValues ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </FormProvider>
    </div>
  )
}
