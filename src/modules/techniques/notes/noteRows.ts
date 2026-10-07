import type { AttackDirection } from "./types";

/** A row while it is being edited; `id` of a row not saved yet is a temporary one. */
export interface EditableRow {
  id: string;
  person1Text: string;
  person2Text: string;
  direction: AttackDirection;
}

/** What the form holds: compared with the saved note to show Save (T4 → T4A). */
export interface NoteDraft {
  title: string;
  tagIds: string[];
  rows: EditableRow[];
}

/** "right" means Person 1 leads, "left" Person 2 (stored values of the former → / ← arrow). */
export const leaderOf = (direction: AttackDirection): 1 | 2 => (direction === "left" ? 2 : 1);

/** Bubble order of a row (T4): the leader on top, the other person under the swap button. */
export const bubbleOrder = (direction: AttackDirection): [1 | 2, 1 | 2] =>
  leaderOf(direction) === 1 ? [1, 2] : [2, 1];

export const toggleDirection = (direction: AttackDirection): AttackDirection =>
  direction === "left" ? "right" : "left";

export const isBlankRow = (row: EditableRow) => !row.person1Text.trim() && !row.person2Text.trim();

export interface RowChanges {
  /** Saved rows removed from the note or emptied. */
  remove: string[];
  /** Saved rows kept, with their new position. */
  update: Array<{ row: EditableRow; orderIndex: number }>;
  /** Rows to insert, with their position. */
  create: Array<{ row: EditableRow; orderIndex: number }>;
}

/**
 * Turns the edited rows into writes. Blank rows are not stored; positions are
 * renumbered from 0 in the order shown, so the saved order always matches.
 */
export function planRowChanges(savedIds: string[], rows: EditableRow[]): RowChanges {
  const saved = new Set(savedIds);
  const kept = rows.filter((row) => !isBlankRow(row));
  const keptIds = new Set(kept.map((row) => row.id));
  const changes: RowChanges = {
    remove: savedIds.filter((id) => !keptIds.has(id)),
    update: [],
    create: [],
  };
  kept.forEach((row, orderIndex) => {
    (saved.has(row.id) ? changes.update : changes.create).push({ row, orderIndex });
  });
  return changes;
}

const sameRow = (a: EditableRow, b: EditableRow) =>
  a.person1Text === b.person1Text && a.person2Text === b.person2Text && a.direction === b.direction;

/** The note as it will be stored: trimmed texts, blank rows dropped. */
export function normalizeDraft(draft: NoteDraft): NoteDraft {
  return {
    title: draft.title.trim(),
    tagIds: draft.tagIds,
    rows: draft.rows
      .filter((row) => !isBlankRow(row))
      .map((row) => ({ ...row, person1Text: row.person1Text.trim(), person2Text: row.person2Text.trim() })),
  };
}

/**
 * True once the title, the tag set or any row's content differs from the
 * saved note. Row ids are ignored: a saved row and the new row it was
 * created from carry different ids.
 */
export function isNoteChanged(saved: NoteDraft, current: NoteDraft): boolean {
  if (saved.title.trim() !== current.title.trim()) return true;
  if (saved.tagIds.length !== current.tagIds.length || saved.tagIds.some((id) => !current.tagIds.includes(id))) {
    return true;
  }
  return saved.rows.length !== current.rows.length || saved.rows.some((row, i) => !sameRow(row, current.rows[i]!));
}
