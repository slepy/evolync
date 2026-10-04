import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_RANK_COLOR,
  canSubmitRank,
  pickerStartColor,
} from "@/modules/grading/components/rankSheetState";

describe("pickerStartColor", () => {
  it("starts a rank without a color on the default the picker shows", () => {
    assert.equal(pickerStartColor(null), DEFAULT_RANK_COLOR);
  });

  it("keeps the rank's own color", () => {
    assert.equal(pickerStartColor("#1E3A8A"), "#1E3A8A");
  });
});

describe("canSubmitRank", () => {
  it("needs a name to create", () => {
    assert.equal(canSubmitRank("   ", null), false);
    assert.equal(canSubmitRank("White", null), true);
  });

  it("needs a change to save an existing rank", () => {
    const rank = { name: "Blue", color: "#1E3A8A" };
    assert.equal(canSubmitRank(" Blue ", "#1E3A8A", rank), false);
    assert.equal(canSubmitRank("Blue belt", "#1E3A8A", rank), true);
    assert.equal(canSubmitRank("Blue", "#2563EB", rank), true);
  });

  it("treats a missing color on the rank as no color", () => {
    assert.equal(canSubmitRank("Blue", null, { name: "Blue" }), false);
  });
});
