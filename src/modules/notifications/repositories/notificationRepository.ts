import { database } from "@/database";
import Notification from "@/database/models/Notification";
import { Q } from "@nozbe/watermelondb";

const collection = () => database.get<Notification>("notifications");

const liveForRecipient = (recipientId: string) => [
  Q.where("recipient_id", recipientId),
  Q.where("deleted_at", null),
];

/**
 * Notifications are created by the server and arrive through sync, so this
 * repository only reads them and sets `read_at` / `deleted_at`.
 */
export const NotificationRepository = {
  async findById(id: string): Promise<Notification | null> {
    try {
      return await collection().find(id);
    } catch {
      return null;
    }
  },

  /** Newest first; re-emits when a row is marked read or its payload changes. */
  observeByRecipient(recipientId: string) {
    return collection()
      .query(...liveForRecipient(recipientId), Q.sortBy("created_at", Q.desc))
      .observeWithColumns(["read_at", "payload", "updated_at"]);
  },

  observeUnreadCount(recipientId: string) {
    return collection()
      .query(...liveForRecipient(recipientId), Q.where("read_at", null))
      .observeCount();
  },

  /** Whether a source row still exists locally (and is not soft-deleted). */
  async entityExists(table: string, id: string): Promise<boolean> {
    try {
      const record: any = await database.get(table).find(id);
      return !record._raw.deleted_at;
    } catch {
      return false;
    }
  },

  async markRead(id: string): Promise<void> {
    const record = await collection().find(id);
    if (record.readAt) return;
    await database.write(async () => {
      await record.update((r) => {
        r.readAt = new Date();
      });
    });
  },

  /** Returns how many notifications were marked read. */
  async markAllRead(recipientId: string): Promise<number> {
    const unread = await collection()
      .query(...liveForRecipient(recipientId), Q.where("read_at", null))
      .fetch();
    if (unread.length === 0) return 0;

    const now = new Date();
    await database.write(async () => {
      await database.batch(
        unread.map((record) =>
          record.prepareUpdate((r) => {
            r.readAt = now;
          }),
        ),
      );
    });
    return unread.length;
  },

  /**
   * Soft delete (sets `deleted_at`, pushed as an update), never
   * `markAsDeleted`: the server ignores deleted ids of this table.
   */
  async softDelete(id: string): Promise<void> {
    const record = await collection().find(id);
    if (record.deletedAt) return;
    await database.write(async () => {
      await record.update((r) => {
        r.deletedAt = new Date();
      });
    });
  },

  /** Soft-deletes every live notification of the recipient; returns how many. */
  async softDeleteAll(recipientId: string): Promise<number> {
    const live = await collection().query(...liveForRecipient(recipientId)).fetch();
    if (live.length === 0) return 0;

    const now = new Date();
    await database.write(async () => {
      await database.batch(
        live.map((record) =>
          record.prepareUpdate((r) => {
            r.deletedAt = now;
          }),
        ),
      );
    });
    return live.length;
  },
};
