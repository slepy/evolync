import { z } from "zod";

export const TAG_NAME_MAX = 30;

/** Name of a tag (Guard, Sweep…): trimmed, 1–30 characters. Messages are translation keys. */
export const tagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "tagsValidationNameRequired")
    .max(TAG_NAME_MAX, "tagsValidationNameTooLong"),
});

export type TagFormValues = z.infer<typeof tagSchema>;

const nameKey = (name: string) => name.trim().toLocaleLowerCase();

/** Is `name` already used by another of the user's tags ("guard" = "Guard")? */
export const isTagNameTaken = (
  name: string,
  tags: ReadonlyArray<{ id: string; name: string }>,
  exceptId?: string,
): boolean => tags.some((tag) => tag.id !== exceptId && nameKey(tag.name) === nameKey(name));
