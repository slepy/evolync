import { z } from "zod";
import { BODY_PART } from "../types/ik";
import { FK_BODY_GROUPS } from "../types/fk";

const VALID_BODY_PARTS = [
  ...Object.values(BODY_PART),
  ...Object.keys(FK_BODY_GROUPS),
];

const jsonObject = z.record(z.any()).refine(
  (v) => v !== null && typeof v === "object",
  { message: "threedValidationInvalidData" },
);

export const createSequenceSchema = z.object({
  title: z.string().min(1, "threedValidationTitleRequired").max(200, "threedValidationTitleTooLong").trim(),
  description: z.string().max(1000, "threedValidationDescriptionTooLong").optional(),
});

export const updateSequenceSchema = z.object({
  title: z.string().min(1, "threedValidationTitleRequired").max(200, "threedValidationTitleTooLong").trim().optional(),
  description: z.string().max(1000, "threedValidationDescriptionTooLong").optional(),
  coverImageUrl: z.string().optional(),
});

export const createTechniqueSchema = z.object({
  title: z.string().min(1, "threedValidationTitleRequired").max(200, "threedValidationTitleTooLong").trim(),
  description: z.string().max(1000, "threedValidationDescriptionTooLong").optional(),
  bodyPart: z.string().refine((v) => VALID_BODY_PARTS.includes(v as never), {
    message: "threedValidationInvalidBodyPart",
  }),
  techniqueData: jsonObject,
});

export const updateTechniqueSchema = z.object({
  title: z.string().min(1, "threedValidationTitleRequired").max(200, "threedValidationTitleTooLong").trim().optional(),
  description: z.string().max(1000, "threedValidationDescriptionTooLong").optional(),
  data: z.string().optional(),
});

export const addStepSchema = z.object({
  sequenceId: z.string().min(1, "threedValidationSequenceIdRequired"),
  orderIndex: z.number().int().nonnegative(),
  durationMs: z.number().nonnegative().optional(),
  stepData: jsonObject,
});
