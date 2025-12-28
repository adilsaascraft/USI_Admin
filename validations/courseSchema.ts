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

    /**
     * Create → FileList (1 file required)
     * Edit   → Existing image URL (string)
     */
    courseImage: z.union([
      z
        .any()
        .refine(
          (file) => file?.length === 1,
          'Please upload a course image (300 × 250 px)'
        ),
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

    /**
     * Optional in schema
     * Required conditionally via superRefine
     */
    amount: z.number().optional(),

    /* ================= STREAM ================= */

    streamLink: z
      .string()
      .min(1, 'Stream link is required.')
      .url('Please enter a valid stream URL.'),

    status: z.enum(['Active', 'Inactive']).refine((val) => val, {
      message: 'Status is required.',
    }),
  })
  .superRefine((data, ctx) => {
    /* Paid → amount required (> 0) */
    if (data.registrationType === 'paid') {
      if (typeof data.amount !== 'number' || data.amount <= 0) {
        ctx.addIssue({
          path: ['amount'],
          message: 'Amount is required for paid courses.',
          code: z.ZodIssueCode.custom,
        })
      }
    }

    /* Free → amount must be 0 or undefined */
    if (data.registrationType === 'free') {
      if (data.amount && data.amount !== 0) {
        ctx.addIssue({
          path: ['amount'],
          message: 'Amount must be 0 for free courses.',
          code: z.ZodIssueCode.custom,
        })
      }
    }
  })

export type CourseFormValues = z.infer<typeof CourseFormSchema>