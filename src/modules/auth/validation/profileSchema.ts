import { z } from "zod";

const phoneValueSchema = z.object({
  prefix: z.string(),
  number: z.string(),
});

/**
 * Validation schema for user profile form.
 */
export const profileSchema = z.object({
  full_name: z.string().min(2, t("fullNameRequired")),
  avatar_url: z.string().nullable().optional(),
  phone: phoneValueSchema
    .optional()
    .refine(
      (val) => !val || val.number === "" || /^\d{4,15}$/.test(val.number),
      { message: t("phoneNumberInvalid") },
    ),
});

/**
 * TypeScript type inferred from the profile validation schema.
 */
export type ProfileFormValues = z.infer<typeof profileSchema>;
