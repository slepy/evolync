import { z } from "zod";
import { EVENT_STATUS, EVENT_VISIBILITY } from "@/database/models/Event";
import { EVENT_PARTICIPANT_STATUS } from "@/database/models/EventParticipant";

/**
 * Validation schema for event visibility
 */
export const eventVisibilitySchema = z.enum(
  [
    EVENT_VISIBILITY.ORGANIZATION,
    EVENT_VISIBILITY.SCHOOL,
    EVENT_VISIBILITY.WHITELIST,
  ],
  {
    errorMap: () => ({ message: "eventValidationInvalidVisibility" }),
  }
);

export type EventVisibilityFormValue = z.infer<typeof eventVisibilitySchema>;

/**
 * Validation schema for event status
 */
export const eventStatusSchema = z.enum(
  [EVENT_STATUS.ACTIVE, EVENT_STATUS.CANCELLED],
  {
    errorMap: () => ({ message: "eventValidationInvalidStatus" }),
  }
);

export type EventStatusFormValue = z.infer<typeof eventStatusSchema>;

/**
 * Validation schema for event participant status
 */
export const eventParticipantStatusSchema = z.enum(
  [
    EVENT_PARTICIPANT_STATUS.ABSENT,
    EVENT_PARTICIPANT_STATUS.ATTENDING,
    EVENT_PARTICIPANT_STATUS.PAID,
  ],
  {
    errorMap: () => ({ message: "eventValidationInvalidParticipantStatus" }),
  }
);

export type EventParticipantStatusFormValue = z.infer<
  typeof eventParticipantStatusSchema
>;

/**
 * Validation schema for creating an event
 */
export const createEventSchema = z
  .object({
    name: z
      .string()
      .min(1, "eventValidationNameRequired")
      .max(200, "eventValidationNameTooLong"),
    shortNote: z.string().max(300, "eventValidationShortNoteTooLong").optional(),
    address: z.string().max(500, "eventValidationAddressTooLong").optional(),
    startDate: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      "eventValidationInvalidStartDate"
    ),
    endDate: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      "eventValidationInvalidEndDate"
    ),
    price: z.preprocess(
      (val) => (typeof val === "string" ? val.replace(",", ".") : val),
      z.coerce.number().min(0, "eventValidationPriceMustBePositive")
    ),
    currency: z
      .string()
      .min(1, "eventValidationCurrencyRequired")
      .max(10, "eventValidationCurrencyTooLong"),
    visibility: eventVisibilitySchema,
    schoolId: z.string().uuid().optional(),
    whitelistedMemberIds: z.array(z.string().uuid()).optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    },
    {
      message: "eventValidationEndDateBeforeStart",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      if (data.visibility === EVENT_VISIBILITY.SCHOOL) {
        return !!data.schoolId;
      }
      return true;
    },
    {
      message: "eventValidationSchoolIdRequired",
      path: ["schoolId"],
    }
  )
  .refine(
    (data) => {
      if (data.visibility === EVENT_VISIBILITY.WHITELIST) {
        return data.whitelistedMemberIds && data.whitelistedMemberIds.length > 0;
      }
      return true;
    },
    {
      message: "eventValidationWhitelistRequired",
      path: ["whitelistedMemberIds"],
    }
  );

export type CreateEventFormValues = z.infer<typeof createEventSchema>;

/**
 * Validation schema for updating an event
 */
export const updateEventSchema = z
  .object({
    name: z
      .string()
      .min(1, "eventValidationNameRequired")
      .max(200, "eventValidationNameTooLong")
      .optional(),
    shortNote: z.string().max(300, "eventValidationShortNoteTooLong").optional(),
    address: z.string().max(500, "eventValidationAddressTooLong").optional(),
    startDate: z
      .string()
      .refine(
        (val) => !isNaN(Date.parse(val)),
        "eventValidationInvalidStartDate"
      )
      .optional(),
    endDate: z
      .string()
      .refine(
        (val) => !isNaN(Date.parse(val)),
        "eventValidationInvalidEndDate"
      )
      .optional(),
    price: z.preprocess(
      (val) => (typeof val === "string" ? val.replace(",", ".") : val),
      z.coerce.number().min(0, "eventValidationPriceMustBePositive")
    ).optional(),
    currency: z
      .string()
      .min(1, "eventValidationCurrencyRequired")
      .max(10, "eventValidationCurrencyTooLong")
      .optional(),
    visibility: eventVisibilitySchema.optional(),
    schoolId: z.string().uuid().optional(),
    whitelistedMemberIds: z.array(z.string().uuid()).optional(),
    status: eventStatusSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        return end >= start;
      }
      return true;
    },
    {
      message: "eventValidationEndDateBeforeStart",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      if (data.visibility === EVENT_VISIBILITY.SCHOOL) {
        return !!data.schoolId;
      }
      return true;
    },
    {
      message: "eventValidationSchoolIdRequired",
      path: ["schoolId"],
    }
  )
  .refine(
    (data) => {
      if (data.visibility === EVENT_VISIBILITY.WHITELIST) {
        return data.whitelistedMemberIds && data.whitelistedMemberIds.length > 0;
      }
      return true;
    },
    {
      message: "eventValidationWhitelistRequired",
      path: ["whitelistedMemberIds"],
    }
  );

export type UpdateEventFormValues = z.infer<typeof updateEventSchema>;
