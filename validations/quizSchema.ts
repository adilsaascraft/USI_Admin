import { z } from 'zod'

/* ================= QUIZ QUESTION ================= */

export const QuizQuestionSchema = z
  .object({
    questionName: z
      .string()
      .min(1, 'Question is required')
      .max(500, 'Question cannot exceed 500 characters'),

    options: z
      .array(
        z
          .string()
          .min(1, 'Option is required')
          .max(200, 'Option cannot exceed 200 characters')
      )
      .min(2, 'At least two options are required'),

    correctAnswer: z.string().min(1, 'Correct answer is required'),
  })
  .refine((data) => data.options.includes(data.correctAnswer), {
    message: 'Correct answer must be one of the options',
    path: ['correctAnswer'],
  })

/* ================= QUIZ FORM ================= */

export const QuizFormSchema = z.object({
  quizduration: z.string().min(1, 'Quiz duration is required'),

  quizQuestions: z
    .array(QuizQuestionSchema)
    .min(1, 'At least one quiz question is required'),
})

/* ================= TYPES ================= */

export type QuizQuestionValues = z.infer<typeof QuizQuestionSchema>
export type QuizFormValues = z.infer<typeof QuizFormSchema>
