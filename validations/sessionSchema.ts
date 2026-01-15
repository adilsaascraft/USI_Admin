import { z } from 'zod'

export const SessionSchema = z.object({
  _id: z.string().optional(), // for Edit mode

  conferenceId: z.string().min(1, 'Conference is required'),

  sessionName: z
    .string()
    .min(1, 'Session Name is required')
    .max(100, 'Session Name cannot exceed 100 characters'),

  sessionDate: z.string().min(1, 'Session Date is required'),

  hallId: z.string().min(1, 'Hall is required'),

  trackId: z.string().min(1, 'Track is required'),

  startTime: z
    .string()
    .regex(
      /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/,
      'Start Time must be in hh:mm AM/PM format'
    ),

  endTime: z
    .string()
    .regex(
      /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/,
      'End Time must be in hh:mm AM/PM format'
    ),

  description: z.string().optional(),
})

export type SessionValues = z.infer<typeof SessionSchema>
