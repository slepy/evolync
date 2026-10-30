import { z } from "zod";
import { BODY_PART } from "../types/ik";
import { FK_BODY_GROUPS } from "../types/fk";

export const THREED_TITLE_MAX = 200;
export const THREED_DESCRIPTION_MAX = 1000;

const VALID_BODY_PARTS = [
  ...Object.values(BODY_PART),
  ...Object.keys(FK_BODY_GROUPS),
];

const jsonObject = z.record(z.any()).refine(
  (v) => v !== null && typeof v === "object",
  { message: "threedValidationInvalidData" },
);

export const createSequenceSchema = z.object({
  title: z.string().trim().min(1, "titleRequired").max(THREED_TITLE_MAX, "threedValidationTitleTooLong"),
  description: z.string().max(THREED_DESCRIPTION_MAX, "threedValidationDescriptionTooLong").optional(),
});

export const updateSequenceSchema = z.object({
  title: z.string().trim().min(1, "titleRequired").max(THREED_TITLE_MAX, "threedValidationTitleTooLong").optional(),
  description: z.string().max(THREED_DESCRIPTION_MAX, "threedValidationDescriptionTooLong").optional(),
});

export const createTechniqueSchema = z.object({
  title: z.string().trim().min(1, "titleRequired").max(THREED_TITLE_MAX, "threedValidationTitleTooLong"),
  description: z.string().max(THREED_DESCRIPTION_MAX, "threedValidationDescriptionTooLong").optional(),
  bodyPart: z.string().refine((v) => VALID_BODY_PARTS.includes(v as never), {
    message: "threedValidationInvalidBodyPart",
  }),
  techniqueData: jsonObject,
});

export const updateTechniqueSchema = z.object({
  title: z.string().trim().min(1, "titleRequired").max(THREED_TITLE_MAX, "threedValidationTitleTooLong").optional(),
  description: z.string().max(THREED_DESCRIPTION_MAX, "threedValidationDescriptionTooLong").optional(),
  data: z.string().optional(),
});

export const addStepSchema = z.object({
  sequenceId: z.string().min(1, "threedValidationSequenceIdRequired"),
  orderIndex: z.number().int().nonnegative(),
  durationMs: z.number().nonnegative().optional(),
  stepData: jsonObject,
});

/** Parsed data, or an Error whose message is the translation key of the first problem. */
export const validated = <T extends z.ZodTypeAny>(schema: T, data: unknown): z.output<T> => {
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "threedValidationInvalidData");
  return parsed.data;
};
