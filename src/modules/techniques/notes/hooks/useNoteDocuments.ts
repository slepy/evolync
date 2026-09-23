import { useStore } from "@/store";
import { useEffect, useState } from "react";
import type TechniqueNoteDocument from "@/database/models/TechniqueNoteDocument";
import { NoteDocumentRepository } from "../repositories";

export const useNoteDocuments = () => {
  const { user } = useStore();
  const [documents, setDocuments] = useState<TechniqueNoteDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    const subscription = NoteDocumentRepository.observeByUserId(user.id).subscribe({
      next: (result: TechniqueNoteDocument[]) => {
        setDocuments(result);
        setIsLoading(false);
      },
      error: (err: Error) => {
        console.error("[useNoteDocuments] Error:", err);
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [user?.id]);

  return { documents, isLoading };
};
