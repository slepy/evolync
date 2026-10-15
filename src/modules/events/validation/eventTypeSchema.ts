import { z } from "zod";

export const EVENT_TYPE_NAME_MAX = 40;

/** Name of an event type (Seminar, Camp…): trimmed, 1–40 characters. */
export const eventTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "eventTypeValidationNameRequired")
    .max(EVENT_TYPE_NAME_MAX, "eventTypeValidationNameTooLong"),
});

export type EventTypeFormValues = z.infer<typeof eventTypeSchema>;

const nameKey = (name: string) => name.trim().toLocaleLowerCase();

/** Is `name` already used by another type of the organization ("camp" = "Camp")? */
export const isEventTypeNameTaken = (
  name: string,
  types: ReadonlyArray<{ id: string; name: string }>,
  exceptId?: string,
): boolean => types.some((type) => type.id !== exceptId && nameKey(type.name) === nameKey(name));
