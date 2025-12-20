import { z } from "zod";

export const WebinarFormSchema = z
  .object({
    webinarName: z
      .string()
      .min(1, "Webinar name is required.")
      .max(100, "Webinar name cannot exceed 100 characters."),

    webinarImage: z
      .any()
      .refine(
        (file) => file?.length === 1,
        "Please upload a webinar image in 300 * 250 px"
      )
      .refine(
        (file) => file?.[0]?.type?.startsWith("image/"),
        "File must be a valid image."
      ),

    startDate: z
      .string()
      .min(1, "Start date is required."),

    endDate: z
      .string()
      .min(1, "End date is required."),

    startTime: z
      .string()
      .min(1, "Start time is required."),

    endTime: z
      .string()
      .min(1, "End time is required."),

    timeZone: z
      .string()
      .min(1, "Time zone is required."),

    registrationType: z.enum(["paid", "free"]).refine(
      (val) => val !== undefined,
      "Registration type is required."
    ),

    amount: z
      .number()
      .min(0, "Amount cannot be negative.")
      .optional(),

    status: z.enum(["Active", "Inactive"]).refine(
      (val) => val !== undefined,
      "Status is required."
    ),

    streamLink: z
      .string()
      .url("Please enter a valid streaming URL.")
      .min(1, "Stream link is required."),
  })
  .superRefine((data, ctx) => {
    // 🔐 Conditional validation: amount required if paid
    if (data.registrationType === "paid" && (!data.amount || data.amount <= 0)) {
      ctx.addIssue({
        path: ["amount"],
        message: "Amount is required for paid webinars.",
        code: z.ZodIssueCode.custom,
      });
    }
  });

export type WebinarFormValues = z.infer<typeof WebinarFormSchema>;
