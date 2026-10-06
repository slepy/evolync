import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALL_TAGS, filterNotes, formatNoteDate, tagsByNote, type NoteListItem } from "../noteList";

const guard = { id: "t-guard", name: "Guard" };
const sweeps = { id: "t-sweeps", name: "Sweeps" };
const subs = { id: "t-subs", name: "Submissions" };

const note = (id: string, title: string, tags = [] as NoteListItem["tags"]): NoteListItem => ({
  id,
  title,
  createdAt: new Date(Date.UTC(2026, 9, 2)),
  tags,
});

const notes = [
  note("n1", "Scissor sweep from closed guard", [guard, sweeps]),
  note("n2", "Armbar from mount", [subs]),
  note("n3", "Pendulum sweep", [guard, sweeps]),
  note("n4", "Cross-step entry drill"),
];
const ids = (list: NoteListItem[]) => list.map((n) => n.id);

describe("filterNotes", () => {
  it("All with no search keeps every note", () => {
    assert.deepEqual(ids(filterNotes(notes, "", ALL_TAGS)), ["n1", "n2", "n3", "n4"]);
  });

  it("a tag chip keeps only notes carrying that tag (T2F)", () => {
    assert.deepEqual(ids(filterNotes(notes, "", sweeps.id)), ["n1", "n3"]);
  });

  it("search matches the title or a tag name, ignoring case", () => {
    assert.deepEqual(ids(filterNotes(notes, "ARMBAR", ALL_TAGS)), ["n2"]);
    assert.deepEqual(ids(filterNotes(notes, "submis", ALL_TAGS)), ["n2"]);
  });

  it("tag and search combine", () => {
    assert.deepEqual(ids(filterNotes(notes, "pendulum", guard.id)), ["n3"]);
    assert.deepEqual(ids(filterNotes(notes, "armbar", guard.id)), []);
  });
});

describe("tagsByNote", () => {
  it("groups links per note in tag-list order and skips deleted tags and duplicates", () => {
    const map = tagsByNote(
      [
        { taggableId: "n1", tagId: sweeps.id },
        { taggableId: "n1", tagId: guard.id },
        { taggableId: "n1", tagId: guard.id },
        { taggableId: "n2", tagId: "t-deleted" },
      ],
      [guard, sweeps, subs],
    );
    assert.deepEqual(map.get("n1"), [guard, sweeps]);
    assert.equal(map.has("n2"), false);
  });
});

describe("formatNoteDate", () => {
  it("prints day then short month", () => {
    const date = new Date(2026, 9, 2, 12);
    assert.equal(formatNoteDate(date, "en"), "2 Oct");
    assert.match(formatNoteDate(date, "pl"), /^2 paź/);
  });
});
