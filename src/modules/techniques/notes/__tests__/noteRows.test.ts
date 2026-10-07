import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isNoteChanged, leaderOf, normalizeDraft, planRowChanges, toggleDirection, type EditableRow, type NoteDraft } from "../noteRows";

const row = (id: string, p1 = "a", p2 = "b", direction: EditableRow["direction"] = "right"): EditableRow => ({
  id,
  person1Text: p1,
  person2Text: p2,
  direction,
});

describe("direction", () => {
  it("arrow right is Person 1 leading, left is Person 2; toggling flips it", () => {
    assert.equal(leaderOf("right"), 1);
    assert.equal(leaderOf("left"), 2);
    assert.equal(toggleDirection("right"), "left");
    assert.equal(toggleDirection("left"), "right");
  });
});

describe("planRowChanges", () => {
  it("updates kept rows, creates new ones and renumbers positions in display order", () => {
    const changes = planRowChanges(["r1", "r2"], [row("new"), row("r2"), row("r1")]);
    assert.deepEqual(changes.remove, []);
    assert.deepEqual(
      changes.update.map((u) => [u.row.id, u.orderIndex]),
      [["r2", 1], ["r1", 2]],
    );
    assert.deepEqual(changes.create.map((c) => [c.row.id, c.orderIndex]), [["new", 0]]);
  });

  it("removes saved rows that were deleted or emptied and never stores blank new rows", () => {
    const changes = planRowChanges(["r1", "r2", "r3"], [row("r1"), row("r3", " ", ""), row("tmp", "", "")]);
    assert.deepEqual(changes.remove, ["r2", "r3"]);
    assert.deepEqual(changes.update.map((u) => [u.row.id, u.orderIndex]), [["r1", 0]]);
    assert.deepEqual(changes.create, []);
  });
});

describe("isNoteChanged", () => {
  const saved: NoteDraft = { title: "Scissor sweep", tagIds: ["g", "s"], rows: [row("r1")] };

  it("is false for the saved note, tag order and title padding aside", () => {
    assert.equal(isNoteChanged(saved, { ...saved, title: " Scissor sweep ", tagIds: ["s", "g"] }), false);
  });

  it("is true after a title, tag, row text, direction or row count change", () => {
    assert.equal(isNoteChanged(saved, { ...saved, title: "Pendulum" }), true);
    assert.equal(isNoteChanged(saved, { ...saved, tagIds: ["g"] }), true);
    assert.equal(isNoteChanged(saved, { ...saved, rows: [row("r1", "x")] }), true);
    assert.equal(isNoteChanged(saved, { ...saved, rows: [row("r1", "a", "b", "left")] }), true);
    assert.equal(isNoteChanged(saved, { ...saved, rows: [row("r1"), row("r2")] }), true);
  });

  it("ignores row ids, so a just-saved draft matches the stored note", () => {
    const draft: NoteDraft = { title: " Scissor sweep ", tagIds: ["g", "s"], rows: [row("tmp", " a ", "b"), row("tmp2", "", " ")] };
    assert.equal(isNoteChanged(saved, draft), true);
    assert.equal(isNoteChanged(saved, normalizeDraft(draft)), false);
  });
});
