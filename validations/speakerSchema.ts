import { z } from 'zod'

export const SpeakerFormSchema = z.object({
  _id: z.string().optional(), // Edit mode

  prefix: z
    .string()
    .min(1, 'Prefix is required.')
    .max(10, 'Prefix cannot exceed 10 characters.'),

  speakerName: z
    .string()
    .min(1, 'Speaker name is required.')
    .max(150, 'Speaker name cannot exceed 150 characters.'),


  specialization: z
    .string()
    .max(200, 'Specialization cannot exceed 200 characters.')
    .optional(),



  // ✅ FILE FIX
  speakerProfilePicture: z.any().optional(),

  affiliation: z
    .string()
    .min(1, 'Affiliation is required.')
    .max(150, 'Affiliation cannot exceed 150 characters.'),

  country: z
    .string()
    .min(1, 'Country is required.')
    .max(100, 'Country cannot exceed 100 characters.'),

  state: z
    .string()
    .min(1, 'State is required.')
    .max(100, 'State cannot exceed 100 characters.').optional(),

  city: z
    .string()
    .min(1, 'City is required.')
    .max(100, 'City cannot exceed 100 characters.').optional(),

  status: z.enum(['Active', 'Inactive']).optional(), // backend default: Active
})

export type SpeakerFormValues = z.infer<typeof SpeakerFormSchema>
