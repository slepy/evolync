import { matchesSearch } from "@/core/components/SearchField/matchesSearch";

/** Value of the "All" chip of the tag filter. */
export const ALL_TAGS = "all";

export interface NoteTag {
  id: string;
  name: string;
}

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

/** Joins taggable links with the user's tags; links to missing (deleted) tags are skipped, tags keep the tag list order. */
export function tagsByNote(
  links: Array<{ taggableId: string; tagId: string }>,
  tags: NoteTag[],
): Map<string, NoteTag[]> {
  const order = new Map(tags.map((tag, index) => [tag.id, index]));
  const byId = new Map(tags.map((tag) => [tag.id, tag]));
  const result = new Map<string, NoteTag[]>();
  for (const link of links) {
    const tag = byId.get(link.tagId);
    if (!tag) continue;
    const list = result.get(link.taggableId) ?? [];
    if (!list.some((t) => t.id === tag.id)) list.push(tag);
    result.set(link.taggableId, list);
  }
  for (const list of result.values()) list.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
  return result;
}

/** "2 Oct" / "2 paź" under a note title. */
export function formatNoteDate(date: Date, language: string): string {
  return date.toLocaleDateString(language.startsWith("pl") ? "pl-PL" : "en-GB", { day: "numeric", month: "short" });
}
