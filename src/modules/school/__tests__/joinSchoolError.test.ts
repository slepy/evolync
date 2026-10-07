import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { joinSchoolErrorText } from "@/modules/school/components/joinSchoolError";

describe("joinSchoolErrorText", () => {
  it("maps known join errors to their alert keys", () => {
    assert.deepEqual(joinSchoolErrorText("invalidSchoolCode"), {
      title: "invalidSchoolCode",
      message: "invalidSchoolCodeMessage",
    });
    assert.equal(joinSchoolErrorText("joinRequestPending")?.title, "joinRequestPending");
  });

  it("falls back to the generic error and has no alert without an error", () => {
    assert.deepEqual(joinSchoolErrorText("network down"), { title: "error", message: "errorUnknown" });
    assert.equal(joinSchoolErrorText(null), null);
  });
});
