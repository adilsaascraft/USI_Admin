import z from 'zod'

export const AssignFacultySchema = z.object({
  _id: z.string().optional(), // for edit mode

  webinarId: z.string().min(1, 'Webinar ID is required.'),

  speakerId: z.string().min(1, 'Speaker ID is required.'),

  facultyType: z
    .string()
    .min(1, 'Faculty  type is required.')
    .max(50, 'Faculty type cannot exceed 50 characters.'),
})

export type AssignFacultyValues = z.infer<typeof AssignFacultySchema>
