import { z } from "zod";

const phoneValueSchema = z.object({
  prefix: z.string(),
  number: z.string().max(20, "studentValidationPhoneTooLong"),
});

/**
 * Validation schema for editing an existing student (same fields as create + phone)
 */
export const studentSchema = z.object({
  displayName: z
    .string()
    .min(2, "studentValidationNameTooShort")
    .max(100, "studentValidationNameTooLong")
    .trim(),
  email: z
    .string()
    .email("studentValidationEmailInvalid")
    .max(255, "studentValidationEmailTooLong")
    .or(z.literal(""))
    .optional(),
  phoneNumber: phoneValueSchema.optional(),
});

export type StudentFormValues = z.infer<typeof studentSchema>;
