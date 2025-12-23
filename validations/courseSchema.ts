import { z } from 'zod'

export const CourseFormSchema = z
  .object({
    /* ================= CORE ================= */

    courseName: z
      .string()
      .min(1, 'Course name is required.')
      .max(100, 'Course name cannot exceed 100 characters.'),

    description: z
      .string()
      .max(100000, 'Description cannot exceed 100000 characters.')
      .optional(),

    /* ================= IMAGE ================= */

    // create → FileList
    // edit   → string URL
    courseImage: z.union([
      z
        .any()
        .refine((file) => file?.length === 1, 'Please upload a course image'),
      z.string().url(),
    ]),

    /* ================= DATE & TIME ================= */

    startDate: z.string().min(1, 'Start date is required.'),
    endDate: z.string().min(1, 'End date is required.'),

    startTime: z.string().min(1, 'Start time is required.'),
    endTime: z.string().min(1, 'End time is required.'),

    timeZone: z.string().min(1, 'Time zone is required.'),

    /* ================= REGISTRATION ================= */

    registrationType: z.enum(['paid', 'free']).pipe(
      z.enum(['paid', 'free']).refine((val) => val, {
        message: 'Registration type is required.',
      })
    ),

    amount: z.number().min(0).optional(),

    /* ================= STATUS ================= */

    status: z.enum(['Active', 'Inactive']).optional(),

    /* ================= STREAM ================= */

    streamLink: z
      .string()
      .url('Please enter a valid stream URL.')
      .min(1, 'Stream link is required.'),
  })
  .superRefine((data, ctx) => {
    // Paid → amount required
    if (
      data.registrationType === 'paid' &&
      (!data.amount || data.amount <= 0)
    ) {
      ctx.addIssue({
        path: ['amount'],
        message: 'Amount is required for paid courses.',
        code: z.ZodIssueCode.custom,
      })
    }

    // Free → force amount = 0 (frontend safety)
    if (data.registrationType === 'free' && data.amount !== 0) {
      ctx.addIssue({
        path: ['amount'],
        message: 'Amount must be 0 for free courses.',
        code: z.ZodIssueCode.custom,
      })
    }
  })

export type CourseFormValues = z.infer<typeof CourseFormSchema>
