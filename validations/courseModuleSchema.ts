import { z } from 'zod'

const CONTENT_TYPES = ['video', 'image', 'document'] as const

export const CourseModuleSchema = z.object({
  _id: z.string().optional(),

  weekCategoryId: z.string().min(1, 'Week category is required'),

  contentType: z.enum(CONTENT_TYPES),

  topicName: z.string().min(1, 'Topic name is required').max(200),

  aboutTopic: z.string().optional(),

  contentUrl: z.string().min(1, 'Content URL is required').url(),

  videoDuration: z.string().optional(),

  description: z.string().optional(),

  // ⚠️ OPTIONAL — must stay optional
  additionalResources: z
    .array(
      z.object({
        value: z.string().min(1),
      })
    )
    .optional(),
})

/* ✅ FORM TYPE MUST MATCH RESOLVER */
export type CourseModuleValues = z.infer<typeof CourseModuleSchema>
