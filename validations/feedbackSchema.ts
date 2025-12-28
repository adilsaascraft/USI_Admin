// validations/feedbackSchema.ts
import { z } from 'zod'

export const FeedbackItemSchema = z.object({
  feedbackName: z.string().min(1, 'Feedback name is required'),

  options: z
    .array(z.string().min(1, 'Option is required'))
    .min(1, 'At least one option is required'),
})
