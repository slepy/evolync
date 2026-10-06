import type Tag from "@/database/models/Tag";
import type Taggable from "@/database/models/Taggable";
import type TechniqueNoteDocument from "@/database/models/TechniqueNoteDocument";
import { TagRepository, TaggableRepository } from "@/modules/tags";
import { useStore } from "@/store";
import { useEffect, useState } from "react";
import { combineLatest } from "rxjs";
import { tagsByNote, type NoteListItem, type NoteTag } from "../noteList";
import { NoteDocumentRepository } from "../repositories";

/** The user's notes with their tags, and the tags for the filter chips; reactive. */
export const useNoteList = () => {
  const userId = useStore((s) => s.user?.id);
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [tags, setTags] = useState<NoteTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setNotes([]);
      setTags([]);
      setIsLoading(false);
      return;
    }

    const subscription = combineLatest([
      NoteDocumentRepository.observeByUserId(userId),
      TagRepository.observeByUserId(userId),
      TaggableRepository.observeByType("note_document"),
    ]).subscribe({
      next: ([documents, tagRecords, links]: [TechniqueNoteDocument[], Tag[], Taggable[]]) => {
        const userTags = tagRecords.map((tag) => ({ id: tag.id, name: tag.name }));
        const byNote = tagsByNote(links, userTags);
        setTags(userTags);
        setNotes(
          documents.map((doc) => ({
            id: doc.id,
            title: doc.title,
            createdAt: doc.createdAt,
            tags: byNote.get(doc.id) ?? [],
          })),
        );
        setIsLoading(false);
      },
      error: (err: Error) => {
        console.error("[useNoteList] Error:", err);
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [userId]);

  return { notes, tags, isLoading };
};
