import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { tagsByEntity } from "../tagsByEntity";

const guard = { id: "t-guard", name: "Guard" };
const sweeps = { id: "t-sweeps", name: "Sweeps" };
const subs = { id: "t-subs", name: "Submissions" };

describe("tagsByEntity", () => {
  it("groups links per record in tag-list order and skips deleted tags and duplicates", () => {
    const map = tagsByEntity(
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
