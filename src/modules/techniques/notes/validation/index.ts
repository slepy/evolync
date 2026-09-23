import { z } from "zod";

export const createNoteDocumentSchema = z.object({
  title: z.string().min(1, "noteTitleRequired").max(200),
  description: z.string().max(500).optional(),
});

export type CreateNoteDocumentFormValues = z.infer<typeof createNoteDocumentSchema>;
