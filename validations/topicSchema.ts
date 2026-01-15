import { z } from 'zod'

export const TopicSchema = z
  .object({
    _id: z.string().optional(),

    conferenceId: z.string().min(1),
    sessionId: z.string().min(1),

    topicType: z.enum([
      'Presentation',
      'Panel Discussion',
      'Quiz',
      'Debate',
    ]),

    title: z.string().min(1, 'Title is required'),

    startTime: z
      .string()
      .regex(
        /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/,
        'Invalid start time'
      ),

    endTime: z
      .string()
      .regex(
        /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/,
        'Invalid end time'
      ),

    videoLink: z.string().url('Video link must be valid'),

    description: z.string().optional(),

    /* ========= SPEAKER IDS ========= */

    // Presentation (single) / Debate (multi)
    speakerId: z.array(z.string()),

    // Panel Discussion
    moderator: z.string().optional(),
    panelist: z.array(z.string()),

    // Quiz
    quizMaster: z.string().optional(),
    teamMember: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    /* ================= Presentation ================= */
    if (data.topicType === 'Presentation') {
      if (data.speakerId.length !== 1) {
        ctx.addIssue({
          path: ['speakerId'],
          message: 'Exactly one speaker is required for Presentation',
          code: z.ZodIssueCode.custom,
        })
      }
    }

    /* ================= Debate ================= */
    if (data.topicType === 'Debate') {
      if (data.speakerId.length < 2) {
        ctx.addIssue({
          path: ['speakerId'],
          message: 'At least two speakers are required for Debate',
          code: z.ZodIssueCode.custom,
        })
      }
    }

    /* ================= Panel Discussion ================= */
    if (data.topicType === 'Panel Discussion') {
      if (!data.moderator) {
        ctx.addIssue({
          path: ['moderator'],
          message: 'Moderator is required',
          code: z.ZodIssueCode.custom,
        })
      }

      if (data.panelist.length === 0) {
        ctx.addIssue({
          path: ['panelist'],
          message: 'At least one panelist is required',
          code: z.ZodIssueCode.custom,
        })
      }
    }

    /* ================= Quiz ================= */
    if (data.topicType === 'Quiz') {
      if (!data.quizMaster) {
        ctx.addIssue({
          path: ['quizMaster'],
          message: 'Quiz Master is required',
          code: z.ZodIssueCode.custom,
        })
      }

      if (data.teamMember.length === 0) {
        ctx.addIssue({
          path: ['teamMember'],
          message: 'At least one team member is required',
          code: z.ZodIssueCode.custom,
        })
      }
    }
  })

export type TopicFormValues = z.infer<typeof TopicSchema>
