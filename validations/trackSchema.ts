import { z } from 'zod'

// Session Track Schema and Types
export const SessionTrackSchema = z.object({
  _id: z.string().optional(), // for Edit mode

  trackName: z
    .string()
    .min(1, 'Track name cannot be empty.')
    .max(50, 'Track name cannot exceed 50 characters.'),

  status: z
    .string()
    .min(1, 'Status is required.')
    .max(50, 'Status cannot exceed 50 characters.'),
})

export type SessionTrackValues = z.infer<typeof SessionTrackSchema>
