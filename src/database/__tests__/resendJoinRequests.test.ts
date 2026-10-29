import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { database } from "@/database";
import { resendPendingJoinRequestsOnce } from "../resendJoinRequests";

const ME = "user-me";

async function seed(id: string, overrides: Record<string, unknown>) {
  const now = Date.now();
  await database.write(async () => {
    await database.get("school_join_requests").create((record) => {
      record._raw = {
        ...record._raw,
        id,
        school_id: "school-1",
        user_id: ME,
        display_name: "Anna",
        email: "anna@test.local",
        status: "pending",
        created_at: now,
        updated_at: now,
        deleted_at: null,
        _status: "synced",
        _changed: "",
        ...overrides,
      } as any;
    });
  });
}

const statusOf = async (id: string) =>
  ((await database.get("school_join_requests").find(id))._raw as any)._status as string;

describe("resendPendingJoinRequestsOnce", () => {
  beforeEach(async () => {
    await database.write(() => database.unsafeResetDatabase());
  });

  it("marks only the user's own pending requests to be pushed again", async () => {
    await seed("mine-pending", {});
    await seed("mine-rejected", { status: "rejected" });
    await seed("mine-dismissed", { deleted_at: Date.now() });
    await seed("someone-else", { user_id: "user-other" });

    assert.equal(await resendPendingJoinRequestsOnce(ME), 1);

    assert.equal(await statusOf("mine-pending"), "created");
    assert.equal(await statusOf("mine-rejected"), "synced");
    assert.equal(await statusOf("mine-dismissed"), "synced");
    assert.equal(await statusOf("someone-else"), "synced");
  });

  it("runs once per device", async () => {
    await seed("first", {});
    await resendPendingJoinRequestsOnce(ME);
    await seed("later", {});

    assert.equal(await resendPendingJoinRequestsOnce(ME), 0);
    assert.equal(await statusOf("later"), "synced");
  });
});
