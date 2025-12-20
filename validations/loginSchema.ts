import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(20, { message: 'Password must not exceed 20 characters' }),
    rememberMe: z.boolean().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
