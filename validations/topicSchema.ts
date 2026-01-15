import { z } from 'zod'

export const TopicSchema = z.object({
  _id: z.string().optional(),

  conferenceId: z.string(),
  sessionId: z.string(),

  topicType: z.enum(['Presentation', 'Panel Discussion', 'Quiz', 'Debate']),

  title: z.string().min(1, 'Title is required'),

  startTime: z.string().regex(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/),

  endTime: z.string().regex(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/),

  videoLink: z.string().url(),

  speakerId: z.array(z.string()),

  // 🔥 FORM-SAFE ARRAYS
  panelist: z.array(z.object({ value: z.string() })),
  teamMember: z.array(z.object({ value: z.string() })),

  moderator: z.string().optional(),
  quizMaster: z.string().optional(),
})

export type TopicFormValues = z.infer<typeof TopicSchema>
