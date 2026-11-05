import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveLaunchStatus } from "@/core/components/LaunchScreen/launchStatus";

describe("resolveLaunchStatus", () => {
  it("syncs the schools when online (L2)", () => {
    assert.equal(resolveLaunchStatus({ isOnline: true }), "syncing");
  });

  it("opens the data saved on the device when offline (L3)", () => {
    assert.equal(resolveLaunchStatus({ isOnline: false }), "offline");
  });

  it("says the app is updating while a newer bundle downloads, online or not", () => {
    assert.equal(resolveLaunchStatus({ isOnline: true, updating: true }), "updating");
    assert.equal(resolveLaunchStatus({ isOnline: false, updating: true }), "updating");
  });
});
