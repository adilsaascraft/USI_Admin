import { z } from 'zod'

export const MeetingSchema = z.object({
  _id: z.string().optional(), // for edit mode

  webinarId: z.string().min(1, 'Webinar ID is required.'),

  meetingName: z
    .string()
    .min(1, 'Meeting name is required.')
    .max(150, 'Meeting name cannot exceed 150 characters.'),

  meetingLink: z
    .string()
    .min(1, 'Meeting link is required.')
    .url('Meeting link must be a valid URL'),
})

export type MeetingValues = z.infer<typeof MeetingSchema>
