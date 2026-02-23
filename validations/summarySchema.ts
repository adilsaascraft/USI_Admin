import { z } from 'zod'

export const SummarySchema = z.object({
  _id: z.string().optional(), // for edit mode

  webinarId: z
    .string()
    .min(1, 'Webinar ID is required.'),

  summary: z
    .string()
    .min(1, 'Summary is required.')
    .max(10000, 'Summary cannot exceed 10000 characters.'),
})

export type SummaryValues = z.infer<typeof SummarySchema>
