import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { stepBoneTransforms } from "../utils/dataCompat";

const rotation = { x: 0, y: 0.38, z: 0, w: 0.92 };

describe("stepBoneTransforms", () => {
  it("reads the main actor's bones of a V2 step", () => {
    const data = JSON.stringify({
      version: 2,
      mainActor: {
        version: 2,
        boneTransforms: { "DEF-forearmR": { rotation } },
        handPresets: {},
        rootPosition: { x: 0, y: 0, z: 0 },
        rootRotation: { x: 0, y: 0, z: 0, w: 1 },
      },
    });
    assert.deepEqual(stepBoneTransforms(data), { "DEF-forearmR": { rotation } });
  });

  it("is empty for a blank or unreadable step", () => {
    assert.deepEqual(stepBoneTransforms(undefined), {});
    assert.deepEqual(stepBoneTransforms(""), {});
    assert.deepEqual(stepBoneTransforms("{not json"), {});
  });
});
