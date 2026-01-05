import { z } from 'zod'

export const ConferenceFormSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Conference name is required.')
      .max(100, 'Conference name cannot exceed 100 characters.'),

    description: z
      .string()
      .min(1, 'Description is required.')
      .max(100000, 'Description cannot exceed 100000 characters.'),

    conferenceType: z.string().min(1, 'conference type is required.'),

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
    timeZone: z.string().min(1, 'Time zone is required.'),

    registrationType: z.enum(['paid', 'free']).pipe(
      z.enum(['paid', 'free']).refine(val => val, {
        message: 'Registration type is required.',
      })
    ),

    amount: z.number().min(0).optional(),

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

export type ConferenceFormValues = z.infer<typeof ConferenceFormSchema>
