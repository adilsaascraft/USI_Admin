import { z } from "zod";

// Zod schema
export const EventFormSchema = z.object({
  eventName: z
    .string()
    .min(1, "Event name cannot be empty.")
    .max(100, "Event name cannot exceed 100 characters."),

  shortName: z
    .string()
    .min(1, "Short name is required.")
    .max(30, "Short name cannot exceed 30 characters."),

  eventImage: z
    .any()
    .refine((file) => file?.length === 1, "Please upload an event image.")
    .refine((file) => file?.[0]?.type?.startsWith("image/"), "File must be a valid image."),

  venueName: z
    .string()
    .min(1, "Venue cannot be empty.")
    .max(50, "Venue name cannot exceed 50 characters."),

  startDate: z
    .string()
    .min(1, "Start date is required.")
    .max(30, "Start date cannot exceed 30 characters."),

  endDate: z
    .string()
    .min(1, "End date is required.")
    .max(30, "End date cannot exceed 30 characters."),

  startTime: z
    .string()
    .min(1, "Start time is required.")
    .max(30, "Start time cannot exceed 30 characters."),

  endTime: z
    .string()
    .min(1, "End time is required.")
    .max(30, "End time cannot exceed 30 characters."),

  timeZone: z
    .string()
    .min(1, "Time zone is required.")
    .max(30, "Time zone cannot exceed 30 characters."),

  eventCode: z
    .string()
    .min(1, "Event code is required.")
    .max(30, "Event code cannot exceed 30 characters."),

  regNum: z
    .string()
    .min(1, "Registration number is required.")
    .max(30, "Registration number cannot exceed 30 characters."),

  organizer: z
    .string()
    .min(1, "Organizer is required.")
    .max(30, "Organizer cannot exceed 30 characters."),

  department: z
    .string()
    .min(1, "Department is required.")
    .max(30, "Department cannot exceed 30 characters."),

  eventCategory: z
    .string()
    .min(1, "Event category is required.")
    .max(30, "Event category cannot exceed 30 characters."),

  eventType: z
    .string()
    .min(1, "Event type is required.")
    .max(30, "Event type cannot exceed 30 characters."),

  registrationType: z
    .string()
    .min(1, "Registration type is required.")
    .max(30, "Registration type cannot exceed 30 characters."),

  currencyType: z.string().optional(),

  country: z
    .string()
    .min(1, "Country is required.")
    .max(30, "Country cannot exceed 30 characters."),

  state: z
    .string()
    .min(1, "State is required.")
    .max(30, "State cannot exceed 30 characters."),

  city: z
    .string()
    .min(1, "City is required.")
    .max(30, "City cannot exceed 30 characters."),

  isEventApp: z.boolean(),
});

// Infer the type for form values
export type EventFormValues = z.infer<typeof EventFormSchema>;
