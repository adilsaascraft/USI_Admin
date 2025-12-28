'use client'

import { useState } from 'react'
import { useForm, useFieldArray, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  toast,
} from '@/lib/imports'

import { QuizFormSchema, QuizFormValues } from '@/validations/quizSchema'

/* ================= COMPONENT ================= */

export default function AddQuizForm({
  webinarId,
  defaultValues,
  onSave,
}: {
  webinarId: string
  defaultValues?: QuizFormValues & { _id?: string }
  onSave?: () => void
}) {
  const [loading, setLoading] = useState(false)

  const form = useForm<QuizFormValues>({
    resolver: zodResolver(QuizFormSchema),
    defaultValues: defaultValues ?? {
      quizduration: '',
      quizQuestions: [
        {
          questionName: '',
          options: [''],
          correctAnswer: '',
        },
      ],
    },
  })

  const { control, watch, setValue } = form

  /* ✅ TOP-LEVEL FIELD ARRAY ONLY */
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'quizQuestions',
  })

  const questions = watch('quizQuestions')

  /* ================= OPTION HELPERS ================= */

  const addOption = (qIndex: number) => {
    const updated = [...questions[qIndex].options, '']
    setValue(`quizQuestions.${qIndex}.options`, updated)
  }

  const removeOption = (qIndex: number, oIndex: number) => {
    const updated = questions[qIndex].options.filter((_, i) => i !== oIndex)
    setValue(`quizQuestions.${qIndex}.options`, updated)

    // reset correct answer if removed
    if (questions[qIndex].correctAnswer === questions[qIndex].options[oIndex]) {
      setValue(`quizQuestions.${qIndex}.correctAnswer`, '')
    }
  }

  /* ================= SUBMIT ================= */

  const onSubmit = async (values: QuizFormValues) => {
    try {
      setLoading(true)

      const endpoint = defaultValues?._id
        ? `/api/quizzes/${defaultValues._id}`
        : `/api/webinars/${webinarId}/quizzes`

      const method = defaultValues?._id ? 'PUT' : 'POST'

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(values),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.message)

      toast.success(defaultValues ? 'Quiz updated' : 'Quiz created')
      onSave?.()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  /* ================= UI ================= */

  return (
    <div className="overflow-auto">
      <FormProvider {...form}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 px-4"
          >
            {/* ================= QUESTIONS ================= */}

            {fields.map((field, qIndex) => (
              <div key={field.id} className="border rounded-xl p-4 space-y-4">
                {/* QUESTION */}
                <FormField
                  control={control}
                  name={`quizQuestions.${qIndex}.questionName`}
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

                {/* OPTIONS */}
                <div className="space-y-2">
                  <FormLabel>Options *</FormLabel>

                  {questions[qIndex].options.map((_, oIndex) => (
                    <div key={oIndex} className="flex gap-2">
                      <FormField
                        control={control}
                        name={`quizQuestions.${qIndex}.options.${oIndex}`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input {...field} placeholder="Option" />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {oIndex === questions[qIndex].options.length - 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addOption(qIndex)}
                        >
                          +
                        </Button>
                      )}

                      {questions[qIndex].options.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => removeOption(qIndex, oIndex)}
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* CORRECT ANSWER */}
                <FormField
                  control={control}
                  name={`quizQuestions.${qIndex}.correctAnswer`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correct Answer *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select correct answer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {questions[qIndex].options
                            .filter(Boolean)
                            .map((opt, i) => (
                              <SelectItem key={i} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* REMOVE QUESTION */}
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => remove(qIndex)}
                  >
                    Remove Question
                  </Button>
                )}
              </div>
            ))}

            {/* ADD MORE QUESTIONS */}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  questionName: '',
                  options: [''],
                  correctAnswer: '',
                })
              }
            >
              + Add Question
            </Button>

            {/* ================= DURATION ================= */}

            <FormField
              control={control}
              name="quizduration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quiz Duration (seconds) *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={1}
                      placeholder="e.g. 45"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ================= FOOTER ================= */}

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
