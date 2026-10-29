import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mergeLocalMemberships } from "../ownMemberships";

const existing = { memberId: "m1", schoolId: "s1", organizationId: "o1" };
const schools = [
  { id: "s1", organizationId: "o1" },
  { id: "s2", organizationId: "o2" },
];

describe("mergeLocalMemberships", () => {
  it("adds an approved membership once its school is synced", () => {
    assert.deepEqual(
      mergeLocalMemberships([existing], [{ id: "m1", schoolId: "s1" }, { id: "m2", schoolId: "s2" }], schools),
      [existing, { memberId: "m2", schoolId: "s2", organizationId: "o2" }],
    );
  });

  it("waits for the school row before adding the membership", () => {
    assert.equal(mergeLocalMemberships([], [{ id: "m3", schoolId: "s3" }], schools), null);
  });

  it("returns null when nothing is new", () => {
    assert.equal(mergeLocalMemberships([existing], [{ id: "m1", schoolId: "s1" }], schools), null);
  });

  it("never drops a membership the local database does not have yet", () => {
    assert.equal(mergeLocalMemberships([existing], [], schools), null);
  });
});
