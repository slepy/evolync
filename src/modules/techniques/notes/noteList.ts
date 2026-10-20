import { matchesSearch } from "@/core/components/SearchField/matchesSearch";
import type { EntityTag } from "@/modules/tags";
import { intlLocaleTag } from "@/core/i18n/localeTags";

/** Value of the "All" chip of the tag filter. */
export const ALL_TAGS = "all";

export type NoteTag = EntityTag;

/** One row of the notes list (T2): the note with its tags resolved. */
export interface NoteListItem {
  id: string;
  title: string;
  createdAt: Date;
  tags: NoteTag[];
}

/** Notes carrying the chosen tag (or all) whose title or tag names match the search. */
export function filterNotes(notes: NoteListItem[], query: string, tagId: string): NoteListItem[] {
  return notes.filter(
    (note) =>
      (tagId === ALL_TAGS || note.tags.some((tag) => tag.id === tagId)) &&
      matchesSearch(query, note.title, ...note.tags.map((tag) => tag.name)),
  );
}

/** "2 Oct" / "2 paź" under a note title. */
export function formatNoteDate(date: Date, language: string): string {
  return date.toLocaleDateString(intlLocaleTag(language, "en-GB"), { day: "numeric", month: "short" });
}
