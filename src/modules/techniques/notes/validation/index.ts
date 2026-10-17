import { z } from "zod";

export const NOTE_TITLE_MAX = 200;

/** Title of a note: trimmed, 1–200 characters. Messages are translation keys. */
export const createNoteDocumentSchema = z.object({
  title: z.string().trim().min(1, "noteTitleRequired").max(NOTE_TITLE_MAX, "notesValidationTitleTooLong"),
  description: z.string().max(500).optional(),
});

export type CreateNoteDocumentFormValues = z.infer<typeof createNoteDocumentSchema>;

/** Keys the note service throws for an invalid title (shown under the TITLE field). */
export const NOTE_TITLE_ERRORS: readonly string[] = ["noteTitleRequired", "notesValidationTitleTooLong"];
