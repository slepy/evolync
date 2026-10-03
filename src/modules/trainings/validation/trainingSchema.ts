import { z } from "zod";
import { TRAINING_VISIBILITY } from "@/database/models/Training";
import { TRAINING_LOCATION_MAX, TRAINING_MODE, TRAINING_NAME_MAX } from "../types/enums";
import {
  TIME_RE,
  isValidDay,
  localToday,
  maxSeriesEnd,
} from "../types/helpers";

const daySchema = z.string().refine(isValidDay, "invalidDate");
const timeSchema = z.string().regex(TIME_RE, "trainingsValidationInvalidTime");

export const trainingVisibilitySchema = z.enum(
  [
    TRAINING_VISIBILITY.ORGANIZATION,
    TRAINING_VISIBILITY.SCHOOL,
    TRAINING_VISIBILITY.WHITELIST,
  ],
  { errorMap: () => ({ message: "trainingsValidationInvalidVisibility" }) },
);

export const seriesRuleSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    frequency: z.enum(["weekly", "monthly"]),
    weekOfMonth: z
      .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(-1)])
      .optional(),
    startTime: timeSchema,
    endTime: timeSchema,
  })
  .refine((rule) => rule.frequency !== "monthly" || rule.weekOfMonth !== undefined, {
    message: "trainingsValidationWeekOfMonthRequired",
    path: ["weekOfMonth"],
  })
  .refine((rule) => rule.endTime > rule.startTime, {
    message: "trainingsValidationEndTimeBeforeStart",
    path: ["endTime"],
  });

const audienceShape = {
  name: z
    .string()
    .trim()
    .min(1, "trainingsValidationNameRequired")
    .max(TRAINING_NAME_MAX, "trainingsValidationNameTooLong"),
  location: z
    .string()
    .max(TRAINING_LOCATION_MAX, "trainingsValidationLocationTooLong")
    .optional(),
  visibility: trainingVisibilitySchema,
  schoolId: z.string().optional(),
  inviteeIds: z.array(z.string()).optional(),
};

const singleSchema = z.object({
  mode: z.literal(TRAINING_MODE.SINGLE),
  ...audienceShape,
  dates: z.array(daySchema).min(1, "trainingsValidationDatesRequired"),
  startTime: timeSchema,
  endTime: timeSchema,
});

const recurringSchema = z.object({
  mode: z.literal(TRAINING_MODE.RECURRING),
  ...audienceShape,
  startDate: daySchema,
  endDate: daySchema,
  rules: z.array(seriesRuleSchema).min(1, "trainingsValidationRulesRequired"),
});

/**
 * Builds the "+ Add training" schema. `getToday` returns the device-local
 * calendar day at validation time, so a form left open over midnight cannot
 * save a past day.
 */
export const buildTrainingSchema = (getToday: () => string = () => localToday()) =>
  z.discriminatedUnion("mode", [singleSchema, recurringSchema]).superRefine((data, ctx) => {
    const today = getToday();

    if (data.visibility === TRAINING_VISIBILITY.SCHOOL && !data.schoolId) {
      ctx.addIssue({ code: "custom", message: "eventValidationSchoolIdRequired", path: ["schoolId"] });
    }
    if (data.visibility === TRAINING_VISIBILITY.WHITELIST && !data.inviteeIds?.length) {
      ctx.addIssue({ code: "custom", message: "eventValidationWhitelistRequired", path: ["inviteeIds"] });
    }

    if (data.mode === TRAINING_MODE.SINGLE) {
      if (data.endTime <= data.startTime) {
        ctx.addIssue({ code: "custom", message: "trainingsValidationEndTimeBeforeStart", path: ["endTime"] });
      }
      if (data.dates.some((day) => day < today)) {
        ctx.addIssue({ code: "custom", message: "trainingsValidationPastDate", path: ["dates"] });
      }
      if (new Set(data.dates).size !== data.dates.length) {
        ctx.addIssue({ code: "custom", message: "trainingsValidationDuplicateDates", path: ["dates"] });
      }
      return;
    }

    if (data.startDate < today) {
      ctx.addIssue({ code: "custom", message: "trainingsValidationPastDate", path: ["startDate"] });
    }
    if (data.endDate < data.startDate) {
      ctx.addIssue({ code: "custom", message: "trainingsValidationEndDateBeforeStart", path: ["endDate"] });
    } else if (data.endDate > maxSeriesEnd(data.startDate)) {
      ctx.addIssue({ code: "custom", message: "trainingsValidationSeriesTooLong", path: ["endDate"] });
    }
  });

export const trainingSchema = buildTrainingSchema();

export type TrainingFormValues = z.infer<typeof singleSchema> | z.infer<typeof recurringSchema>;
export type SingleTrainingFormValues = z.infer<typeof singleSchema>;
export type RecurringTrainingFormValues = z.infer<typeof recurringSchema>;
