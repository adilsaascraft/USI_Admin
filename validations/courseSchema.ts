import { z } from 'zod'

export const CourseFormSchema = z
  .object({
    courseName: z
      .string()
      .min(1, 'Course name is required.')
      .max(100, 'Course name cannot exceed 100 characters.'),

    description: z
      .string()
      .min(1, 'Description is required.')
      .max(100000, 'Description cannot exceed 100000 characters.'),

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

    registrationType: z.enum(['paid', 'free']).pipe(
      z.enum(['paid', 'free']).refine((val) => val, {
        message: 'Registration type is required.',
      })
    ),

    amount: z.number().min(0).optional(),

    streamLink: z
      .string()
      .url('Please enter a valid stream URL.')
      .min(1, 'Stream link is required.'),

    status: z.enum(['Active', 'Inactive']).refine((val) => val, {
      message: 'Status is required.',
    }),
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
