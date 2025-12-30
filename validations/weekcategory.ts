import z from 'zod'

export const WeekCategorySchema = z.object({
  _id: z.string().optional(), // for edit mode
  
  courseId: z.string().min(1, 'Course ID is required.'),
  
  weekCategoryName: z
    .string()
    .min(1, 'Week Category Name is required.')
    .max(100, 'Week Category Name cannot exceed 100 characters.'),
    
  status: z.string().min(1, 'Status is required'),
})

export type WeekCategoryValues = z.infer<typeof WeekCategorySchema>