import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { clampToRange, eulerDegToQuat, formatCm, formatDeg, quatToEulerDeg, sliderFraction, withAxisDeg } from "../jointAxes";

const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-6, `${a} ≉ ${b}`);

describe("joint axes", () => {
  it("round-trips Euler degrees through the quaternion", () => {
    const e = quatToEulerDeg(eulerDegToQuat({ x: 24, y: -8, z: 0 }));
    close(e.x, 24);
    close(e.y, -8);
    close(e.z, 0);
  });

  it("an unset rotation reads as 0° on every axis", () => {
    assert.deepEqual(quatToEulerDeg(undefined), { x: 0, y: 0, z: 0 });
  });

  it("setting one axis keeps the others", () => {
    const q = withAxisDeg(eulerDegToQuat({ x: 24, y: -8, z: 0 }), "z", 30);
    const e = quatToEulerDeg(q);
    close(e.x, 24);
    close(e.y, -8);
    close(e.z, 30);
  });

  it("maps values to a centered slider and clamps them", () => {
    assert.equal(sliderFraction(0, 180), 0.5);
    assert.equal(sliderFraction(90, 180), 0.75);
    assert.equal(sliderFraction(400, 180), 1);
    assert.equal(clampToRange(-0.9, 0.5), -0.5);
  });

  it("formats with a sign and a real minus", () => {
    assert.equal(formatDeg(24.4), "+24°");
    assert.equal(formatDeg(-8), "−8°");
    assert.equal(formatDeg(0.2), "0°");
    assert.equal(formatCm(0.123), "+12 cm");
  });
});
