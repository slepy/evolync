import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveSyncPillStatus } from "@/core/components/SyncedPill/syncPillStatus";

const base = { isSyncing: false, isOnline: true, lastSyncError: null };

describe("resolveSyncPillStatus", () => {
  it("is synced when online, idle and the last sync succeeded", () => {
    assert.equal(resolveSyncPillStatus(base), "synced");
  });

  it("shows a sync in progress", () => {
    assert.equal(resolveSyncPillStatus({ ...base, isSyncing: true }), "syncing");
  });

  it("shows a failed last sync", () => {
    assert.equal(resolveSyncPillStatus({ ...base, lastSyncError: "timeout" }), "error");
  });

  it("puts offline before everything else", () => {
    assert.equal(
      resolveSyncPillStatus({ isSyncing: true, isOnline: false, lastSyncError: "x" }),
      "offline",
    );
  });
});
