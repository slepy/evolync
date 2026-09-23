import { z } from "zod";

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const createRankSchema = z.object({
  name: z
    .string()
    .min(1, "gradingValidationNameRequired")
    .max(50, "gradingValidationNameTooLong")
    .trim(),
  color: z
    .string()
    .regex(HEX_COLOR_REGEX, "gradingValidationColorInvalid")
    .optional(),
});

export type CreateRankFormValues = z.infer<typeof createRankSchema>;

export const updateRankSchema = z.object({
  name: z
    .string()
    .min(1, "gradingValidationNameRequired")
    .max(50, "gradingValidationNameTooLong")
    .trim()
    .optional(),
  color: z
    .string()
    .regex(HEX_COLOR_REGEX, "gradingValidationColorInvalid")
    .optional()
    .nullable(),
});

export type UpdateRankFormValues = z.infer<typeof updateRankSchema>;
