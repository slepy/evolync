import { useStore } from "@/store";
import { useEffect, useState } from "react";
import type TechniqueNoteDocument from "@/database/models/TechniqueNoteDocument";
import { TaggableRepository } from "@/modules/tags/repositories";
import { NoteDocumentRepository } from "../repositories";

export const useNoteDocumentsByTag = (activeTagId: string | null) => {
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
      next: async (allDocs: TechniqueNoteDocument[]) => {
        if (!activeTagId) {
          setDocuments(allDocs);
          setIsLoading(false);
          return;
        }

        const taggedIds = await TaggableRepository.fetchEntityIdsByTag(
          activeTagId,
          "note_document",
        );
        setDocuments(allDocs.filter((doc) => taggedIds.includes(doc.id)));
        setIsLoading(false);
      },
      error: (err: Error) => {
        console.error("[useNoteDocumentsByTag] Error:", err);
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [user?.id, activeTagId]);

  return { documents, isLoading };
};
