import { z } from 'zod'

export const UserFormSchema = z.object({
  _id: z.string().optional(), // Edit mode

  prefix: z
    .string()
    .min(1, 'Prefix is required.')
    .max(10, 'Prefix cannot exceed 10 characters.'),

  name: z
    .string()
    .min(1, 'Name is required.')
    .max(100, 'Name cannot exceed 100 characters.'),

  email: z
    .string()
    .email('Please enter a valid email address.')
    .max(100, 'Email cannot exceed 100 characters.'),

  mobile: z
    .string()
    .regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits.'),

  qualification: z
    .string()
    .min(1, 'Qualification is required.')
    .max(100, 'Qualification cannot exceed 100 characters.'),

  affiliation: z
    .string()
    .max(150, 'Affiliation cannot exceed 150 characters.')
    .optional(),

  country: z
    .string()
    .min(1, 'Country is required.')
    .max(100, 'Country cannot exceed 100 characters.'),

  state: z.string().max(100, 'State cannot exceed 100 characters.').optional(),

  city: z.string().max(100, 'City cannot exceed 100 characters.').optional(),

  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits.')
    .optional(),

  profilePicture: z
    .string()
    .url('Profile picture must be a valid URL.')
    .optional(),

  role: z.enum(['admin', 'user']).optional(), // backend default: user

  status: z.enum(['Pending', 'Approved']).optional(), // backend default: Pending

  membershipNumber: z.string().optional(),

  password: z
    .string()
    .min(6, 'Password must be at least 6 characters.')
    .optional(), // required only in create flow
})

export type UserFormValues = z.infer<typeof UserFormSchema>
