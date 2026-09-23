import { useEffect, useState } from "react";
import type TechniqueNoteRow from "@/database/models/TechniqueNoteRow";
import { NoteRowRepository } from "../repositories";

export const useNoteRows = (documentId: string | undefined) => {
  const [rows, setRows] = useState<TechniqueNoteRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!documentId) {
      setRows([]);
      setIsLoading(false);
      return;
    }

    const subscription = NoteRowRepository.observeByDocumentId(documentId).subscribe({
      next: (result: TechniqueNoteRow[]) => {
        setRows(result);
        setIsLoading(false);
      },
      error: (err: Error) => {
        console.error("[useNoteRows] Error:", err);
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [documentId]);

  return { rows, isLoading };
};
