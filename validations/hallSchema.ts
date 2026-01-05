import { z } from 'zod';

// Session Hall Schema and Types
export const SessionHallSchema = z.object({
  _id: z.string().optional(), // for Edit mode

  hallName: z
    .string()
    .min(1, ' hall name cannot be empty.')
    .max(50, ' hall name cannot exceed 50 characters.'),

  status: z
    .string()
    .min(1, 'Status is required.')
    .max(50, 'Status cannot exceed 50 characters.'),
});

export type SessionHallValues = z.infer<typeof SessionHallSchema>;