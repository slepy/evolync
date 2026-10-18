import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  bodyPartFilterOf,
  bodyPartLabelKey,
  countStepsBySequence,
  filterSequences,
  filterTechniques,
  formatThreeDDate,
  type SequenceListItem,
  type TechniqueListItem,
} from "../library";

const guard = { id: "t-guard", name: "Guard" };
const subs = { id: "t-subs", name: "Submissions" };
const created = new Date(Date.UTC(2026, 9, 2));

const sequence = (id: string, title: string, tags: SequenceListItem["tags"] = []): SequenceListItem => ({
  id,
  title,
  createdAt: created,
  stepCount: 0,
  tags,
});
const technique = (id: string, title: string, bodyPart: string): TechniqueListItem => ({
  id,
  title,
  bodyPart,
  createdAt: created,
});
const ids = (list: Array<{ id: string }>) => list.map((item) => item.id);

describe("filterSequences", () => {
  const sequences = [sequence("s1", "Scissor sweep", [guard]), sequence("s2", "Armbar from mount", [subs])];

  it("matches the title or a tag name, ignoring case", () => {
    assert.deepEqual(ids(filterSequences(sequences, "")), ["s1", "s2"]);
    assert.deepEqual(ids(filterSequences(sequences, "ARMBAR")), ["s2"]);
    assert.deepEqual(ids(filterSequences(sequences, "guard")), ["s1"]);
  });
});

describe("filterTechniques", () => {
  const techniques = [
    technique("t1", "Overhook grip", "rightArm"),
    technique("t2", "Cross-collar grip", "rightHand"),
    technique("t3", "Knee shield", "leftLeg"),
    technique("t4", "Old wrist frame", "leftWrist"),
    technique("t5", "Posture break", "spine"),
  ];
  const label = (bodyPart: string) => (bodyPart === "rightHand" ? "Right hand" : bodyPart);

  it("a body-part chip keeps that group, V1 targets included", () => {
    assert.deepEqual(ids(filterTechniques(techniques, "", "all", label)), ["t1", "t2", "t3", "t4", "t5"]);
    assert.deepEqual(ids(filterTechniques(techniques, "", "arms", label)), ["t1", "t4"]);
    assert.deepEqual(ids(filterTechniques(techniques, "", "legs", label)), ["t3"]);
  });

  it("search matches the title or the body-part label", () => {
    assert.deepEqual(ids(filterTechniques(techniques, "grip", "all", label)), ["t1", "t2"]);
    assert.deepEqual(ids(filterTechniques(techniques, "right hand", "all", label)), ["t2"]);
    assert.deepEqual(ids(filterTechniques(techniques, "grip", "hands", label)), ["t2"]);
  });
});

describe("body parts", () => {
  it("maps V2 groups and V1 targets to labels and chips", () => {
    assert.equal(bodyPartLabelKey("rightArm"), "threedBodyRightArm");
    assert.equal(bodyPartLabelKey("rightWrist"), "threedBodyRightArm");
    assert.equal(bodyPartLabelKey("fullbody"), "threedBodyFullbody");
    assert.equal(bodyPartFilterOf("hips"), "spine");
    assert.equal(bodyPartFilterOf("fullbody"), null);
  });
});

describe("countStepsBySequence", () => {
  it("counts steps per sequence", () => {
    const counts = countStepsBySequence([{ sequenceId: "a" }, { sequenceId: "a" }, { sequenceId: "b" }]);
    assert.equal(counts.get("a"), 2);
    assert.equal(counts.get("b"), 1);
    assert.equal(counts.get("c"), undefined);
  });
});

describe("formatThreeDDate", () => {
  it("prints day then short month", () => {
    const date = new Date(2026, 9, 2, 12);
    assert.equal(formatThreeDDate(date, "en"), "2 Oct");
    assert.match(formatThreeDDate(date, "pl"), /^2 paź/);
  });
});
