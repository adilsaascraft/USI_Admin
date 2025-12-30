import { z } from 'zod'

export const CourseFormSchema = z
  .object({
    courseName: z
      .string()
      .min(1, 'Course name is required.')
      .max(100, 'Course name cannot exceed 100 characters.'),

    description: z.string().optional(),

    courseImage: z.union([
      z
        .any()
        .refine(
          (file) => file?.length === 1,
          'Please upload a course image (300 × 250 px)'
        ),
      z.string().url(),
    ]),

    startDate: z.string().min(1, 'Start date is required.'),
    endDate: z.string().min(1, 'End date is required.'),

    startTime: z.string().min(1, 'Start time is required.'),
    endTime: z.string().min(1, 'End time is required.'),

    timeZone: z.string().min(1, 'Time zone is required.'),

    registrationType: z.enum(['paid', 'free']),

    amount: z.number().optional(),

    streamLink: z
      .string()
      .url('Please enter a valid stream URL.')
      .min(1, 'Stream link is required.'),

    status: z.enum(['Active', 'Inactive']),
  })
  .superRefine((data, ctx) => {
    if (data.registrationType === 'paid') {
      if (!data.amount || data.amount <= 0) {
        ctx.addIssue({
          path: ['amount'],
          message: 'Amount is required for paid courses.',
          code: z.ZodIssueCode.custom,
        })
      }
    }
  })

export type CourseFormValues = z.infer<typeof CourseFormSchema>
