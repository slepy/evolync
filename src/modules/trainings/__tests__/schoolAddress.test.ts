import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pickSchoolAddress, toSchoolAddressItems } from "../components/schoolAddress";

describe("school address picker", () => {
  const items = toSchoolAddressItems([
    { id: "a", name: "Alpha", address: "Main St 1" },
    { id: "b", name: "Beta", address: null },
  ]);

  it("picking a school pastes its address", () => {
    assert.equal(pickSchoolAddress(items[0]), "Main St 1");
  });

  it("a school without an address is disabled and pastes nothing", () => {
    assert.equal(items[1].disabled, true);
    assert.equal(pickSchoolAddress(items[1]), null);
  });
});
