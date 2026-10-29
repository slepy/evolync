import { Q } from "@nozbe/watermelondb";
import { database } from "./index";

/**
 * One-time repair (2026-10-26). Join requests pushed while the server had no
 * `status` column were rejected by Supabase, but the sync function answered
 * 200 anyway, so WatermelonDB marked them synced: they never reached the
 * instructor, and the local pending request blocks sending a new one.
 *
 * Marks the user's own pending requests as created again, so the next push
 * upserts them. The upsert is by id, so a request the server already has is
 * only rewritten with the same values. Runs once per device.
 */
const DONE_KEY = "resendJoinRequests20261026";

export async function resendPendingJoinRequestsOnce(userId: string): Promise<number> {
  if (await database.localStorage.get(DONE_KEY)) return 0;

  const pending = await database
    .get("school_join_requests")
    .query(Q.where("user_id", userId), Q.where("status", "pending"), Q.where("deleted_at", null))
    .fetch();

  if (pending.length > 0) {
    await database.write(async () => {
      await database.batch(
        pending.map((request) =>
          request.prepareUpdate((record) => {
            (record._raw as any)._status = "created";
            (record._raw as any)._changed = "";
          }),
        ),
      );
    });
  }

  await database.localStorage.set(DONE_KEY, true);
  return pending.length;
}
