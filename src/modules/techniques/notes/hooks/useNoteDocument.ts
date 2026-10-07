import type TechniqueNoteDocument from "@/database/models/TechniqueNoteDocument";
import { useEffect, useState } from "react";
import { NoteDocumentRepository } from "../repositories";

/** One note, reactive; `null` once it is missing or deleted. */
export const useNoteDocument = (documentId: string | undefined) => {
  const [document, setDocument] = useState<TechniqueNoteDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!documentId) {
      setDocument(null);
      setIsLoading(false);
      return;
    }

    const subscription = NoteDocumentRepository.observeById(documentId).subscribe({
      next: (doc: TechniqueNoteDocument) => {
        setDocument(doc.deletedAt ? null : doc);
        setIsLoading(false);
      },
      error: () => {
        setDocument(null);
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [documentId]);

  return { document, isLoading };
};
