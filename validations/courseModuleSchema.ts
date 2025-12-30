import { z } from 'zod'

export const CourseModuleSchema = z.object({
  _id: z.string().optional(),
  weekCategoryId: z.string().min(1, 'Week category is required'),
  contentType: z.enum(['video', 'image', 'document'], {
    message: 'Content type is required',
  }),
  topicName: z.string().min(1, 'Topic name is required').max(200),
  aboutTopic: z.string().optional(),
  
  // FIXED: Changed from z.array(z.string()) to array of objects
  additionalQuestions: z.array(
    z.object({
      value: z.string().min(1, 'Question cannot be empty'),
    })
  ).default([]),

  contentUrl: z.string().min(1, 'Content URL is required').url(),
  videoDuration: z.string().optional(),

  // FIXED: Changed from z.array(z.string()) to array of objects
  additionalResources: z.array(
    z.object({
      value: z.string().min(1, 'Resource URL cannot be empty'),
    })
  ).default([]),
})

export type CourseModuleValues = z.infer<typeof CourseModuleSchema>