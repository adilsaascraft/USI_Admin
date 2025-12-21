import { z } from 'zod'

export const WebinarFormSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Webinar name is required.')
      .max(100, 'Webinar name cannot exceed 100 characters.'),

    description: z
      .string()
      .min(1, 'Description is required.')
      .max(100000, 'Description cannot exceed 100000 characters.'),

    // ✅ FIXED: backend expects webinarType
    webinarType: z.string().min(1, 'Webinar type is required.'),

    // ✅ FIXED: allow FileList (create) OR string URL (edit)
    image: z.union([
      z
        .any()
        .refine(
          (file) => file?.length === 1,
          'Please upload a webinar image (300 × 250 px)'
        ),
      z.string().url(),
    ]),

    startDate: z.string().min(1, 'Start date is required.'),
    endDate: z.string().min(1, 'End date is required.'),
    startTime: z.string().min(1, 'Start time is required.'),
    endTime: z.string().min(1, 'End time is required.'),

    timeZone: z.string().min(1, 'Time zone is required.'),

    registrationType: z.enum(['paid', 'free']).pipe(
      z.enum(['paid', 'free']).refine(val => val, {
        message: 'Registration type is required.',
      })
    ),

    amount: z.number().min(0).optional(),

    status: z.enum(['Active', 'Inactive']).refine(val => val, {
      message: 'Status is required.',
    }),

    streamLink: z
      .string()
      .url('Please enter a valid streaming URL.')
      .min(1, 'Stream link is required.'),
  })
  .superRefine((data, ctx) => {
    if (
      data.registrationType === 'paid' &&
      (!data.amount || data.amount <= 0)
    ) {
      ctx.addIssue({
        path: ['amount'],
        message: 'Amount is required for paid webinars.',
        code: z.ZodIssueCode.custom,
      })
    }
  })

export type WebinarFormValues = z.infer<typeof WebinarFormSchema>
