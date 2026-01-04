import { z } from "zod";
export const SettingSchema = z
  .object({
    _id: z.string().optional(), // For Edit mode
    faculty: z.boolean().default(false),
    faq: z.boolean().default(false),
    feedback: z.boolean().default(false),
    quiz: z.boolean().default(false),
    meeting: z.boolean().default(false),
    question: z.boolean().default(false),
  })

export type SettingValues = z.infer<typeof SettingSchema>;
