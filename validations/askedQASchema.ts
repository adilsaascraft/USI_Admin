import { z } from 'zod'

/* ================= Q&A ITEM ================= */

export const QuestionAnswerSchema = z.object({
  question: z
    .string()
    .min(1, 'Question is required.')
    .max(500, 'Question cannot exceed 500 characters.'),

  answer: z
    .string()
    .min(1, 'Answer is required.')
    .max(5000, 'Answer cannot exceed 5000 characters.'),
})

export type QuestionAnswerValues = z.infer<typeof QuestionAnswerSchema>
